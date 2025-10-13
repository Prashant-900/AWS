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
    
    def extract_streamable_content(self, buffer):
        """
        Extract content that can be safely streamed without breaking format tags.
        Returns (streamable_content, remaining_buffer)
        """
        if not buffer:
            return "", ""
            
        # Format tags that we need to handle carefully
        format_tags = ['TEXT', 'CODE', 'JSON', 'MARKDOWN', 'LATEX', 'MERMAID', 'CSV', 'IMAGE', 'TABLE']
        
        # Strategy: Find the latest safe point to stream up to
        
        # First, look for the last complete closing tag
        latest_safe_point = -1
        
        for tag in format_tags:
            closing_tag = f"[/{tag}]"
            last_closing = buffer.rfind(closing_tag)
            
            if last_closing != -1:
                end_pos = last_closing + len(closing_tag)
                latest_safe_point = max(latest_safe_point, end_pos)
        
        # If we found complete closing tags, stream up to the latest one
        if latest_safe_point > 0:
            return buffer[:latest_safe_point], buffer[latest_safe_point:]
        
        # No complete closing tags found, look for content before the first opening tag
        first_opening_pos = len(buffer)  # Default to end of buffer
        
        for tag in format_tags:
            opening_tag = f"[{tag}]"
            pos = buffer.find(opening_tag)
            if pos != -1:
                first_opening_pos = min(first_opening_pos, pos)
        
        # If there's content before the first opening tag, it's safe to stream
        if first_opening_pos > 0 and first_opening_pos < len(buffer):
            return buffer[:first_opening_pos], buffer[first_opening_pos:]
        
        # Check for incomplete/partial opening tags at the end
        # Pattern: [A-Z] or [A-Z]+ that might be part of a tag
        for i in range(len(buffer) - 1, max(0, len(buffer) - 20), -1):
            if buffer[i] == '[':
                # Found an opening bracket, check if what follows could be a tag
                remaining_text = buffer[i:]
                
                # Check if it could be the start of any known tag
                could_be_tag = False
                for tag in format_tags:
                    if tag.startswith(remaining_text[1:]) and len(remaining_text) < len(tag) + 2:
                        could_be_tag = True
                        break
                
                if could_be_tag:
                    # This looks like a partial tag, stream everything before it
                    return buffer[:i], buffer[i:]
        
        # If buffer is getting long (>100 chars) and no tags are involved,
        # find a safe break point to prevent excessive buffering
        if len(buffer) > 100:
            # Look for safe break points (space, newline, punctuation)
            for i in range(len(buffer) - 50, 0, -1):
                if buffer[i] in ' \n\r\t.,;!?':
                    return buffer[:i + 1], buffer[i + 1:]
        
        # No safe streaming point found, hold everything in buffer
        return "", buffer
    
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
            stream_buffer = ""  # Buffer to accumulate chunks until we have complete segments
            
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
                
                # Only process non-empty text
                if text:
                    stream_buffer += text
                    full_response += text
                    
                    # Extract complete segments that can be safely streamed
                    streamable_content, remaining_buffer = self.extract_streamable_content(stream_buffer)
                    
                    if streamable_content:
                        chunk_count += 1
                        await self.send(text_data=json.dumps({
                            'type': 'stream_chunk',
                            'message_id': message_id,
                            'content': streamable_content,
                            'timestamp': datetime.now().isoformat()
                        }))
                        
                        # Update buffer to keep only the remaining incomplete content
                        stream_buffer = remaining_buffer
            
            # Send any remaining content in the buffer
            if stream_buffer.strip():
                await self.send(text_data=json.dumps({
                    'type': 'stream_chunk',
                    'message_id': message_id,
                    'content': stream_buffer,
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