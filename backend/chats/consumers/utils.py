import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class UtilsMixin:
    """Utility functions for WebSocket consumer"""
    
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
        logger.warning(f"Error sent to client: {message}")
    
    async def send_success(self, message, data=None):
        """Send success message to client"""
        success_data = {
            'type': 'success',
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        
        if data:
            success_data['data'] = data
            
        await self.send(text_data=json.dumps(success_data))
        logger.info(f"Success message sent: {message}")
    
    async def send_connection_status(self, status, session_id=None):
        """Send connection status update"""
        await self.send(text_data=json.dumps({
            'type': 'connection',
            'status': status,
            'session_id': session_id or self.session_id,
            'timestamp': datetime.now().isoformat()
        }))
        logger.info(f"Connection status sent: {status}")
    
    def log_connection_event(self, event, details=None):
        """Log connection events with consistent formatting"""
        user_info = f"User {self.user.id}" if self.user else "Unknown User"
        session_info = f"Session {self.session_id}" if self.session_id else "No Session"
        
        log_message = f"🔌 {event}: {user_info}, {session_info}"
        
        if details:
            log_message += f" - {details}"
            
        logger.info(log_message)