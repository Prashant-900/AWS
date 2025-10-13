import asyncio
import logging
from typing import AsyncGenerator
from strands import Agent
from strands.models.ollama import OllamaModel
from .format_response import SYSTEM_MESSAGES

logger = logging.getLogger(__name__)

class StreamingAgent:
    def __init__(self):
        """Initialize the streaming agent with Ollama model"""
        try:
            self.model = OllamaModel(
                host="http://localhost:11434",
                model_id="llama3.2",  # model pulled via Ollama
                max_tokens=512,
                temperature=0.7
            )
            
            self.agent = Agent(
                model=self.model,
                tools=[],
                callback_handler=None
            )
            
            logger.info("✅ Streaming agent initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize streaming agent: {str(e)}")
            self.agent = None

    async def stream_response(self, user_input: str) -> AsyncGenerator[str, None]:
        """Stream AI response with system message formatting"""
        logger.info(f"🤖 stream_response called with: '{user_input}'")
        
        try:
            if not self.agent:
                yield "[TEXT]I apologize, but the AI service is not available.[/TEXT]"
                return
            
            # Get appropriate system message
            system_message = SYSTEM_MESSAGES["default"]
            
            # Create full prompt with system message
            full_prompt = f"{system_message}\n\nUser: {user_input}"
            
            logger.info("🚀 Starting LLM streaming from Ollama...")
            
            # Stream directly from the agent without complex formatting
            async for event in self.agent.stream_async(full_prompt):
                if event and isinstance(event, dict):
                    logger.debug(f"📤 Streaming event: {repr(event)}")
                    
                    if "data" in event:
                        data = event["data"]
                        if data:
                            yield data
                    
                    await asyncio.sleep(0)  # allow event loop to switch
            
            logger.info("✅ Finished streaming response.")
            
        except Exception as e:
            logger.error(f"❌ Streaming error: {str(e)}")
            yield "[TEXT]I encountered an error while processing your request. Please try again.[/TEXT]"