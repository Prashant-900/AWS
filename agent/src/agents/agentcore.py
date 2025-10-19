import os
import logging
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands_tools import mem0_memory  # use mem0 memory
from src.utils.pinecone_tools import pinecone_retrieve  # updated function-based tool
from strands_tools import calculator
# -------------------------
# Session Memory Manager
# -------------------------
class SessionMemory:
    """Manage per-session memory using mem0_memory"""
    def __init__(self):
        self.sessions = {}

    def get_memory(self, session_token: str):
        if session_token not in self.sessions:
            # Use mem0_memory for each session with session_token as context
            self.sessions[session_token] = mem0_memory
        return self.sessions[session_token]

session_memory_manager = SessionMemory()

# -------------------------
# Logging
# -------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")

# -------------------------
# Bedrock Model
# -------------------------
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID")
BEDROCK_REGION = os.getenv("BEDROCK_REGION")

model = BedrockModel(
    model_id=BEDROCK_MODEL_ID,
    max_tokens=500,
    temperature=0.2
)

# -------------------------
# Agent Factory
# -------------------------
def create_agent_for_session(session_token: str) -> Agent:
    """Create an agent for a specific session with memory and Pinecone retrieval"""
    memory = session_memory_manager.get_memory(session_token)
    
    tools = [
        memory,  # session-specific mem0 memory
        pinecone_retrieve,  # function-based Pinecone retrieval tool
        calculator
    ]
    
    agent = Agent(
        model=model,
        tools=tools,
        system_prompt=f"""You are a helpful and conversational AI assistant. When responding, use these format tags to structure your content:

- Wrap regular text in [TEXT]...[/TEXT]
- Wrap code in [CODE]...[/CODE] 
- Wrap JSON data in [JSON]...[/JSON]
- Wrap Mermaid diagrams in [MERMAID]...[/MERMAID]
- Wrap math formulas in [LATEX]...[/LATEX]
- Wrap markdown content in [MARKDOWN]...[/MARKDOWN]
- Wrap CSV data in [CSV]...[/CSV]
- Wrap image URLs in [IMAGE]...[/IMAGE]
- Wrap table data (JSON format) in [TABLE]...[/TABLE]

IMPORTANT FORMATTING RULES:
1. You can use multiple formats in one response by placing them sequentially
2. Each tag MUST be properly closed with its corresponding closing tag
3. Do NOT nest tags inside other tags
4. Always close tags in the same order they were opened
5. If user asks for a specific format, use only that format

Example of a multi-format response:
[TEXT]Here's an explanation of the code:[/TEXT][CODE]print('Hello World')[/CODE][TEXT]This prints a greeting message.[/TEXT]

---

### 🔹 MEMORY & RETRIEVAL INSTRUCTIONS

IMPORTANT: Your user_id for memory operations is: {session_token}

**Memory Usage Guidelines:**
1. Use **mem0_memory** to remember and recall important details from our conversation (preferences, context, facts, etc.)
   - Always use user_id="{session_token}" when storing or retrieving memories
   - When recalling information, integrate it naturally into your response
   - Only mention "I remember" or reference memory explicitly when it adds value to the conversation

2. Use **pinecone_retrieve** to access information from uploaded documents and files
   - Search for relevant content when users ask about uploaded materials
   - When using retrieved information, you can mention it came from "the documents you've shared" if helpful

**Response Style:**
- Be conversational and natural - avoid robotic phrases like "from memory" unless contextually appropriate
- Integrate remembered information seamlessly into your responses
- Respond as if you naturally remember our conversation history
- When you don't have information, ask naturally rather than stating technical limitations
- if you need memory then respond only after getting memmory not before it

**Examples of Natural Responses:**
- Instead of: "Your favorite color is red (from memory)"
- Say: "Your favorite color is red!" or "I know you love red"
- Instead of: "I found this in uploaded files"
- Say: "Based on the document you shared..." or "According to your materials..."

**Memory Strategy:**
- Store: User preferences, important facts, context from conversations, file summaries
- Retrieve: When users ask about past topics, preferences, or shared materials
- Integrate: Make responses feel like a natural conversation with someone who remembers you
"""
    )
    return agent



async def stream_agent_response(session_token: str, user_input: str):
    """Stream agent response in real-time"""
    agent = create_agent_for_session(session_token)
    contextual_input = f"[Session: {session_token}] {user_input}"
    
    # Use the agent's streaming capability
    async for event in agent.stream_async(contextual_input):
        # Extract data from the event dictionary
        if isinstance(event, dict):
            if "data" in event:
                yield event["data"]
        elif isinstance(event, str):
            yield event
        else:
            # Fallback for other event types
            yield str(event)
