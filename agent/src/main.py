# strands-bedrock-agent/main.py
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

from fastapi import FastAPI, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from src.agents.agentcore import  stream_agent_response
import json

app = FastAPI(title="Strands Bedrock Agent")

# Allow CORS for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
    return {"status": "alive"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "strands-bedrock-agent"}

@app.post("/chat/stream")
async def chat_stream(session_token: str = Form(...), message: str = Form(...)):
    try:
        # Validate inputs
        if not session_token.strip():
            raise ValueError("Session token is required")
        if not message.strip():
            raise ValueError("Message is required")
        
        # Generate streaming response using Server-Sent Events
        async def generate_stream():
            try:
                chunk_count = 0
                async for chunk in stream_agent_response(session_token, message):
                    if chunk:  # Only send non-empty chunks
                        chunk_count += 1
                        # Format as Server-Sent Events
                        yield f"data: {json.dumps({'content': chunk, 'type': 'chunk'})}\n\n"
                
                # Send end signal with metadata
                yield f"data: {json.dumps({'type': 'end', 'total_chunks': chunk_count})}\n\n"
                
            except Exception as stream_error:
                # Send error within the stream
                yield f"data: {json.dumps({'error': str(stream_error), 'type': 'error'})}\n\n"
        
        return StreamingResponse(
            generate_stream(), 
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )
    except Exception as e:
        # Return error as streaming response
        async def error_stream():
            yield f"data: {json.dumps({'error': str(e), 'type': 'error'})}\n\n"
        
        return StreamingResponse(error_stream(), media_type="text/plain")

