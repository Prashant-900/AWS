import asyncio
import logging
from typing import AsyncGenerator
from strands import Agent
from strands.models.ollama import OllamaModel
from strands_tools import calculator

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
                tools=[calculator],
                callback_handler=None
            )
            
            logger.info("✅ Streaming agent initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize streaming agent: {str(e)}")
            self.agent = None

    async def stream_response(self, user_input: str) -> AsyncGenerator[str, None]:
        """Stream AI response for the given input"""
        logger.info(f"🤖 stream_response called with: '{user_input}'")
        
        try:
            # --- ✅ REAL MODEL STREAMING ---
            if not self.agent:
                yield "I apologize, but the AI service is not available."
                return
            
            logger.info("🚀 Starting LLM streaming from Ollama...")
            
            # Stream directly from the agent
            async for event in self.agent.stream_async(user_input):
                if event and isinstance(event, dict):
                    logger.debug(f"📤 Streaming event: {repr(event)}")
                    
                    # Extract data from the event as per documentation
                    if "data" in event:
                        data = event["data"]
                        if data:
                            yield data
                    
                    await asyncio.sleep(0)  # allow event loop to switch
            
            logger.info("✅ Finished streaming from model.")
            
        except Exception as e:
            logger.error(f"❌ Streaming error: {str(e)}")
            error_response = "I encountered an error while processing your request. Please try again."
            for char in error_response:
                yield char
                await asyncio.sleep(0.03)

