import json
import logging
from datetime import datetime
from channels.db import database_sync_to_async
from ..models import ChatSession, Message

logger = logging.getLogger(__name__)


class MessageHandlerMixin:
    """Handles message processing and database operations"""
    
    async def handle_chat_message(self, data):
        """Handle chat messages and initiate AI responses"""
        try:
            content = data.get('content', '').strip()
            logger.info(f"🎯 Received chat message: '{content}' from user {self.user.id}")
            
            if not content:
                await self.send_error('Message content cannot be empty')
                return
            
            # Save user message to database
            user_message = await self.save_message('user', content)
            logger.info(f"💾 Saved user message to database: ID {user_message.id}")
            
            # Send user message confirmation (optional, as frontend adds it immediately)
            await self.send(text_data=json.dumps({
                'type': 'message_received',
                'message': {
                    'id': user_message.id,
                    'sender': 'user',
                    'content': content,
                    'timestamp': user_message.timestamp.isoformat()
                }
            }))
            
            logger.info(f"🚀 Starting AI response streaming for: '{content}'")
            # Start AI response streaming
            await self.stream_ai_response(content)
            
        except Exception as e:
            logger.error(f"❌ Chat message error: {str(e)}")
            await self.send_error('Failed to process message')

    @database_sync_to_async
    def save_message(self, sender, content):
        """Save message to database"""
        try:
            session = ChatSession.objects.get(id=self.session_id, user=self.user)
            message = Message.objects.create(
                session=session,
                sender=sender,
                content=content
            )
            logger.info(f"Message saved: {sender} message (ID: {message.id}) in session {self.session_id}")
            return message
        except Exception as e:
            logger.error(f"Database save error: {str(e)}")
            raise