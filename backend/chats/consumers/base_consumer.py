import json
import logging
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer

from .auth_handler import AuthenticationMixin
from .message_handler import MessageHandlerMixin
from .stream_handler import StreamHandlerMixin
from .heartbeat_handler import HeartbeatMixin
from .utils import UtilsMixin

logger = logging.getLogger(__name__)


class ChatConsumer(
    AuthenticationMixin,
    MessageHandlerMixin,
    StreamHandlerMixin,
    HeartbeatMixin,
    UtilsMixin,
    AsyncWebsocketConsumer
):
    """
    Main WebSocket consumer for chat functionality.
    
    This consumer handles:
    - User authentication via JWT tokens
    - Real-time chat messaging
    - AI response streaming
    - Connection monitoring and heartbeat
    - Session management
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session_token = None
        self.session_id = None  # Internal DB ID, set after verification
        self.session_group_name = None
        self.user = None

    async def connect(self):
        """Handle WebSocket connection"""
        try:
            # Extract session token from URL
            self.session_token = self.scope['url_route']['kwargs']['session_token']
            self.session_group_name = f'chat_{self.session_token}'
            
            self.log_connection_event("Connection attempt", f"Session Token: {self.session_token}")
            
            # Authenticate user
            user = await self.authenticate_user()
            if not user:
                await self.close(code=4001, reason='Authentication failed')
                return
            
            self.user = user
            
            # Verify session belongs to user
            session_valid = await self.verify_session()
            if not session_valid:
                await self.close(code=4004, reason='Session not found')
                return
            
            # Join session group for potential multi-user features
            await self.channel_layer.group_add(
                self.session_group_name,
                self.channel_name
            )
            
            # Accept the WebSocket connection
            await self.accept()
            
            # Start connection monitoring
            await self.start_heartbeat()
            
            # Send connection confirmation
            await self.send_connection_status('connected', str(self.session_token))
            
            self.log_connection_event("Connected successfully")
            
        except Exception as e:
            logger.error(f"❌ Connection error: {str(e)}")
            await self.close(code=4000, reason='Connection failed')

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            # Stop heartbeat monitoring
            await self.stop_heartbeat()
            
            # Leave session group
            if self.session_group_name:
                await self.channel_layer.group_discard(
                    self.session_group_name,
                    self.channel_name
                )
            
            self.log_connection_event("Disconnected", f"Code: {close_code}")
            
        except Exception as e:
            logger.error(f"❌ Disconnect error: {str(e)}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            # Update activity timestamp for heartbeat monitoring
            self.update_activity()
            
            # Parse message
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.debug(f"📨 Received message type: {message_type}")
            
            # Route message to appropriate handler
            if message_type == 'heartbeat':
                await self.handle_heartbeat()
            elif message_type == 'authenticate':
                await self.handle_authenticate(data)
            elif message_type == 'send_message':
                await self.handle_chat_message(data)
            elif message_type == 'ping':  # Keep backward compatibility
                await self.handle_heartbeat()
            elif message_type == 'chat_message':  # Keep backward compatibility
                await self.handle_chat_message(data)
            else:
                logger.warning(f"❓ Unknown message type: {message_type}")
                await self.send_error(f'Invalid message type: {message_type}', 'INVALID_MESSAGE_TYPE')
                
        except json.JSONDecodeError:
            logger.error("❌ Invalid JSON format received")
            await self.send_error('Invalid JSON format', 'INVALID_JSON')
        except Exception as e:
            logger.error(f"❌ Message processing error: {str(e)}")
            await self.send_error('Message processing failed', 'PROCESSING_ERROR')