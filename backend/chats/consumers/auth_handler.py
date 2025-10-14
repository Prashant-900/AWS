import json
import logging
from datetime import datetime
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from ..models import ChatSession

logger = logging.getLogger(__name__)


class AuthenticationMixin:
    """Handles WebSocket authentication logic"""
    
    async def authenticate_user(self):
        """Authenticate user from token"""
        try:
            # Get token from query parameters
            token = None
            query_string = self.scope.get('query_string', b'').decode()
            
            if query_string:
                params = dict([param.split('=') for param in query_string.split('&') if '=' in param])
                token = params.get('token')
            
            if not token:
                logger.warning("No token provided in query string")
                return None
            
            # Validate JWT token
            try:
                access_token = AccessToken(token)
                user_id = access_token.payload.get('user_id')
                user = await database_sync_to_async(User.objects.get)(id=user_id)
                logger.info(f"User authenticated: {user.username} (ID: {user.id})")
                return user
            except (InvalidToken, TokenError) as e:
                logger.warning(f"Invalid token: {str(e)}")
                return None
            except ObjectDoesNotExist:
                logger.warning(f"User not found for token")
                return None
                
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return None

    @database_sync_to_async
    def verify_session(self):
        """Verify that the session belongs to the authenticated user using session_token"""
        try:
            session = ChatSession.objects.get(session_token=self.session_token, user=self.user)
            # Store the actual session ID for internal use
            self.session_id = session.id
            logger.info(f"Session {self.session_token} verified for user {self.user.id}")
            return True
        except ChatSession.DoesNotExist:
            logger.warning(f"Session {self.session_token} not found or doesn't belong to user {self.user.id}")
            return False

    async def handle_authenticate(self, data):
        """Handle authentication messages (already authenticated in connect)"""
        # User is already authenticated during connection
        # Just send confirmation
        await self.send(text_data=json.dumps({
            'type': 'authenticated',
            'user_id': self.user.id,
            'username': self.user.username,
            'timestamp': datetime.now().isoformat()
        }))
        logger.info(f"Authentication confirmation sent for user {self.user.id}")