"""
AI Agent Package for Chat Application

This package contains the LLM agent with simplified system message approach.
The AI is instructed to generate properly formatted responses using system messages.
"""

from .llm import StreamingAgent
from .format_response import SYSTEM_MESSAGES

__all__ = [
    'StreamingAgent',
    'SYSTEM_MESSAGES'
]