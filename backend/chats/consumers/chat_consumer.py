import json
import asyncio
import logging
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from rest_framework.exceptions import AuthenticationFailed
from ..models import ChatSession, Message
import aiohttp
import os

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session_token = None
        self.user = None
        self.session = None
        self.session_group_name = None
        self.is_streaming = False
        
    async def connect(self):
        """Handle WebSocket connection"""
        try:
            # Extract session token from URL
            self.session_token = self.scope['url_route']['kwargs']['session_token']
            self.session_group_name = f'chat_{self.session_token}'
            
            logger.info(f"WebSocket connection attempt for session: {self.session_token}")
            
            # Authenticate user from query params
            query_string = self.scope.get('query_string', b'').decode()
            token = None
            
            # Parse query string for token
            if query_string:
                for param in query_string.split('&'):
                    if param.startswith('token='):
                        token = param.split('=', 1)[1]
                        break
            
            if not token:
                logger.error("No authentication token provided")
                await self.close(code=4001, reason='No authentication token')
                return
            
            # Authenticate user
            user = await self.authenticate_user(token)
            if not user:
                logger.error("Authentication failed")
                await self.close(code=4001, reason='Authentication failed')
                return
            
            self.user = user
            
            # Verify session belongs to user
            session = await self.get_session()
            if not session:
                logger.error(f"Session {self.session_token} not found for user {user.id}")
                await self.close(code=4004, reason='Session not found')
                return
            
            self.session = session
            
            # Join session group
            await self.channel_layer.group_add(
                self.session_group_name,
                self.channel_name
            )
            
            # Accept the WebSocket connection
            await self.accept()
            
            # Send connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection',
                'status': 'connected',
                'session_token': self.session_token,
                'timestamp': datetime.now().isoformat()
            }))
            
            # Send authentication confirmation
            await self.send(text_data=json.dumps({
                'type': 'authenticated',
                'user_id': self.user.id,
                'username': self.user.username,
                'timestamp': datetime.now().isoformat()
            }))
            
            logger.info(f"WebSocket connected successfully for user {self.user.id}, session {self.session_token}")
            
        except Exception as e:
            logger.error(f"Connection error: {str(e)}")
            await self.close(code=4000, reason='Connection failed')
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            # Leave session group
            if self.session_group_name:
                await self.channel_layer.group_discard(
                    self.session_group_name,
                    self.channel_name
                )
            
            logger.info(f"WebSocket disconnected for session {self.session_token}, code: {close_code}")
            
        except Exception as e:
            logger.error(f"Disconnect error: {str(e)}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.info(f"Received message type: {message_type} for session {self.session_token}")
            
            # Route message to appropriate handler
            if message_type == 'heartbeat':
                await self.handle_heartbeat()
            elif message_type == 'authenticate':
                await self.handle_authenticate(data)
            elif message_type == 'send_message':
                await self.handle_chat_message(data)
            elif message_type == 'ping':  # Keep backward compatibility
                await self.handle_heartbeat()
            else:
                logger.warning(f"Unknown message type: {message_type}")
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON received: {str(e)}")
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Message handling error: {str(e)}")
            await self.send_error(f"Message processing failed: {str(e)}")
    
    async def handle_heartbeat(self):
        """Handle heartbeat messages"""
        await self.send(text_data=json.dumps({
            'type': 'heartbeat_ack',
            'timestamp': datetime.now().isoformat()
        }))
    
    async def handle_authenticate(self, data):
        """Handle authentication messages (already authenticated at connection)"""
        await self.send(text_data=json.dumps({
            'type': 'authenticated',
            'user_id': self.user.id,
            'username': self.user.username,
            'timestamp': datetime.now().isoformat()
        }))
    
    async def handle_chat_message(self, data):
        """Handle chat message and stream AI response"""
        try:
            content = data.get('content', '').strip()
            if not content:
                await self.send_error("Message content is required")
                return
            
            # Check if already streaming
            if self.is_streaming:
                await self.send_error("Already streaming a response. Please wait.")
                return
            
            self.is_streaming = True
            
            # Save user message to database
            message = await self.save_message(content, 'user')
            
            # Confirm message received
            await self.send(text_data=json.dumps({
                'type': 'message_received',
                'message_id': message.id,
                'content': content,
                'timestamp': message.timestamp.isoformat()
            }))
            
            # Start AI response streaming
            await self.stream_ai_response(message)
            
        except Exception as e:
            logger.error(f"Chat message handling error: {str(e)}")
            await self.send_error(f"Failed to process message: {str(e)}")
            self.is_streaming = False
    
    async def stream_ai_response(self, user_message):
        """Stream AI response from the agent service"""
        try:
            # Send stream start
            await self.send(text_data=json.dumps({
                'type': 'stream_start',
                'message_id': user_message.id,
                'timestamp': datetime.now().isoformat()
            }))
            
            # Call the FastAPI agent service
            agent_base_url = os.getenv('AGENT_SERVICE_URL', 'http://localhost:8000')
            agent_url = f"{agent_base_url}/chat/stream"
            
            async with aiohttp.ClientSession() as session:
                form_data = aiohttp.FormData()
                form_data.add_field('session_token', self.session_token)
                form_data.add_field('message', user_message.content)
                
                async with session.post(agent_url, data=form_data) as response:
                    if response.status == 200:
                        full_content = ""
                        
                        async for line in response.content:
                            if line:
                                line = line.decode('utf-8').strip()
                                if line.startswith('data: '):
                                    try:
                                        chunk_data = json.loads(line[6:])
                                        
                                        if chunk_data.get('type') == 'chunk':
                                            content = chunk_data.get('content', '')
                                            full_content += content
                                            
                                            # Send chunk to client
                                            await self.send(text_data=json.dumps({
                                                'type': 'stream_chunk',
                                                'content': content,
                                                'message_id': user_message.id,
                                                'timestamp': datetime.now().isoformat()
                                            }))
                                        
                                        elif chunk_data.get('type') == 'end':
                                            # Stream completed
                                            break
                                        
                                        elif chunk_data.get('type') == 'error':
                                            error_msg = chunk_data.get('error', 'Agent error')
                                            raise Exception(f"Agent error: {error_msg}")
                                    
                                    except json.JSONDecodeError:
                                        continue
                        
                        # Save AI response to database
                        ai_message = await self.save_message(full_content, 'ai')
                        
                        # Send stream end
                        await self.send(text_data=json.dumps({
                            'type': 'stream_end',
                            'message_id': ai_message.id,
                            'final_content': full_content,
                            'timestamp': ai_message.timestamp.isoformat()
                        }))
                    
                    else:
                        raise Exception(f"Agent service error: {response.status}")
        
        except Exception as e:
            logger.error(f"AI streaming error: {str(e)}")
            await self.send_error(f"AI response failed: {str(e)}")
        
        finally:
            self.is_streaming = False
    
    async def send_error(self, message, error_code=None):
        """Send error message to client"""
        error_data = {
            'type': 'error',
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        
        if error_code:
            error_data['code'] = error_code
            
        await self.send(text_data=json.dumps(error_data))
        logger.error(f"Error sent to client: {message}")
    
    @database_sync_to_async
    def authenticate_user(self, token):
        """Authenticate user using JWT token"""
        try:
            # Import here to avoid circular imports
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth.models import User
            
            # Validate token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user
            user = User.objects.get(id=user_id)
            return user
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return None
    
    @database_sync_to_async
    def get_session(self):
        """Get chat session"""
        try:
            session = ChatSession.objects.get(
                session_token=self.session_token,
                user=self.user
            )
            return session
        except ChatSession.DoesNotExist:
            return None
    
    @database_sync_to_async
    def save_message(self, content, sender):
        """Save message to database"""
        try:
            message = Message.objects.create(
                session=self.session,
                content=content,
                sender=sender
            )
            return message
        except Exception as e:
            logger.error(f"Failed to save message: {str(e)}")
            raise