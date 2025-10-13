import json
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class HeartbeatMixin:
    """Handles connection monitoring and heartbeat functionality"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.heartbeat_task = None
        self.last_activity = None
        self.connection_timeout = 300  # 5 minutes
        self.heartbeat_interval = 30   # 30 seconds
    
    async def start_heartbeat(self):
        """Start the heartbeat monitoring task"""
        self.last_activity = datetime.now()
        self.heartbeat_task = asyncio.create_task(self.heartbeat_loop())
        logger.info(f"Heartbeat monitoring started for user {self.user.id if self.user else 'Unknown'}")
    
    async def stop_heartbeat(self):
        """Stop the heartbeat monitoring task"""
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
            try:
                await self.heartbeat_task
            except asyncio.CancelledError:
                pass
            logger.info(f"Heartbeat monitoring stopped for user {self.user.id if self.user else 'Unknown'}")
    
    def update_activity(self):
        """Update the last activity timestamp"""
        self.last_activity = datetime.now()
    
    async def handle_heartbeat(self):
        """Handle heartbeat messages for connection keep-alive"""
        await self.send(text_data=json.dumps({
            'type': 'heartbeat_ack',
            'timestamp': datetime.now().isoformat()
        }))
        logger.debug(f"Heartbeat acknowledged for user {self.user.id if self.user else 'Unknown'}")

    async def heartbeat_loop(self):
        """Monitor connection and send periodic heartbeat"""
        try:
            while True:
                await asyncio.sleep(self.heartbeat_interval)
                
                # Check if connection is inactive
                if self.last_activity:
                    inactive_time = datetime.now() - self.last_activity
                    if inactive_time.seconds > self.connection_timeout:
                        logger.info(f"⏰ Closing inactive connection: User {self.user.id if self.user else 'Unknown'}")
                        await self.close(code=4002, reason='Connection timeout')
                        break
                
                # Send periodic heartbeat
                await self.send(text_data=json.dumps({
                    'type': 'heartbeat',
                    'timestamp': datetime.now().isoformat()
                }))
                
                logger.debug(f"💓 Heartbeat sent to user {self.user.id if self.user else 'Unknown'}")
                
        except asyncio.CancelledError:
            logger.debug("Heartbeat loop cancelled")
        except Exception as e:
            logger.error(f"❤️‍🩹 Heartbeat error: {str(e)}")