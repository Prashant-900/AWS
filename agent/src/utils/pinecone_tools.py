import os
import logging
from pinecone import Pinecone
from google import genai
from dotenv import load_dotenv
from strands import tool

# -------------------------
# Setup
# -------------------------
load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index = pc.Index(os.environ["PINECONE_INDEX"])
client = genai.Client()

# -------------------------
# Pinecone Retriever Tool
# -------------------------
@tool
def pinecone_retrieve(query: str, session_token: str, top_k: int = 3):
    """
    Retrieve top-k relevant chunks from Pinecone for a given query in a session namespace.
    
    Args:
        query (str): User query.
        session_token (str): Namespace for session-specific data.
        top_k (int): Number of top matches to return.
    
    Returns:
        List[dict]: List of dicts with metadata and score for each chunk.
    """
    try:
        # Generate embedding
        embedding_result = client.models.embed_content(
            model="models/embedding-001",  # "gemini-embedding-001" is alias, both work
            contents=query,
            config=genai.types.EmbedContentConfig(output_dimensionality=1024)
        )

        # Safely extract embedding vector
        vector = (
            embedding_result.embeddings[0].values
            if hasattr(embedding_result, "embeddings")
            else embedding_result.embedding.values
        )

        # Query Pinecone
        results = index.query(
            vector=vector,
            top_k=top_k,
            namespace=session_token,
            include_metadata=True
        )

        matches = results.get("matches", [])
        retrieved = [
            {
                "score": match.get("score"),
                "metadata": match.get("metadata")
            }
            for match in matches if match.get("metadata")
        ]

        logging.info(f"✅ Retrieved {len(retrieved)} chunks from Pinecone for session {session_token}")
        return retrieved

    except genai.ApiException as e:
        logging.error(f"❌ Gemini API error: {e}")
        return []
    except Exception as e:
        logging.error(f"❌ Error retrieving from Pinecone: {e}", exc_info=True)
        return []
