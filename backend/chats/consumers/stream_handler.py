import json
import logging
from datetime import datetime
from ..agent.llm import StreamingAgent

logger = logging.getLogger(__name__)


class StreamHandlerMixin:
    """Handles AI response streaming"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.streaming_agent = StreamingAgent()
    
    async def stream_ai_response(self, user_input):
        """Stream AI response in real-time from local Ollama model via Strands."""
        try:
            message_id = f"ai_msg_{datetime.now().timestamp()}"
            logger.info(f"🎬 Starting stream for message ID: {message_id}")
            
            # Send stream start notification
            await self.send(text_data=json.dumps({
                'type': 'stream_start',
                'message_id': message_id,
                'timestamp': datetime.now().isoformat()
            }))

            full_response = ""
            chunk_count = 0
            
            async for chunk in self.streaming_agent.stream_response(user_input):
                if not chunk:
                    continue

                # Handle different chunk types from our agent
                if isinstance(chunk, str):
                    text = chunk
                elif isinstance(chunk, dict):
                    text = chunk.get("data", "") or chunk.get("content", "")
                elif chunk is not None:
                    text = str(chunk)
                else:
                    continue
                
                # Only add non-empty text
                if text:
                    full_response += text
                    chunk_count += 1

                    await self.send(text_data=json.dumps({
                        'type': 'stream_chunk',
                        'message_id': message_id,
                        'content': text,
                        'timestamp': datetime.now().isoformat()
                    }))
            
            logger.info(f"📝 Stream complete: {chunk_count} chunks, {len(full_response)} characters")
            
            # Save complete message to database
            ai_message = await self.save_message('ai', full_response)
            
            # Send stream end notification
            await self.send(text_data=json.dumps({
                'type': 'stream_end',
                'message_id': message_id,
                'final_content': full_response,
                'message': {
                    'id': ai_message.id,
                    'sender': 'ai',
                    'content': full_response,
                    'timestamp': ai_message.timestamp.isoformat()
                }
            }))
            
            logger.info(f"✅ Stream completed successfully for message ID: {message_id}")

        except Exception as e:
            logger.error(f"❌ AI streaming error: {str(e)}")
            
            # Send fallback response
            fallback = "Sorry, I'm unable to process your request right now. Please try again."
            try:
                ai_message = await self.save_message('ai', fallback)
                await self.send(text_data=json.dumps({
                    'type': 'stream_end',
                    'message_id': f"ai_msg_error_{datetime.now().timestamp()}",
                    'final_content': fallback,
                    'message': {
                        'id': ai_message.id,
                        'sender': 'ai',
                        'content': fallback,
                        'timestamp': ai_message.timestamp.isoformat()
                    },
                    'error': True
                }))
                logger.info("Fallback response sent due to streaming error")
            except Exception as fallback_error:
                logger.error(f"Failed to send fallback response: {str(fallback_error)}")