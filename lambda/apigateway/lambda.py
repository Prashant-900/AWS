import json
import os
import logging
from io import BytesIO
import boto3
import pdfplumber
import docx2txt
from pinecone import Pinecone
from google import genai

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Optional LangChain
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except Exception:
    RecursiveCharacterTextSplitter = None

# Environment variables (set in Lambda console)
PINECONE_API_KEY = os.environ["PINECONE_API_KEY"]
PINECONE_INDEX = os.environ["PINECONE_INDEX"]

GOOGLE_API_KEY = os.environ["GOOGLE_API_KEY"]  # Lambda environment variable
client = genai.Client(api_key=GOOGLE_API_KEY)

# Initialize clients
s3_client = boto3.client("s3")
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX)

# --- Helper to extract text ---
def extract_text(file_bytes, filename):
    if filename.lower().endswith(".txt"):
        return file_bytes.decode("utf-8")
    elif filename.lower().endswith(".pdf"):
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            return "\n".join([page.extract_text() or "" for page in pdf.pages])
    elif filename.lower().endswith(".docx"):
        return docx2txt.process(BytesIO(file_bytes))
    else:
        logger.warning(f"Unsupported file type: {filename}")
        return None

# --- Lambda handler ---
def lambda_handler(event, context):
    logger.info("Lambda triggered by S3 event")
    logger.debug(f"Event: {json.dumps(event, indent=2)}")

    try:
        for record in event.get("Records", []):
            if record.get("eventSource") != "aws:s3":
                continue

            bucket_name = record["s3"]["bucket"]["name"]
            object_key = record["s3"]["object"]["key"]
            logger.info(f"Processing s3://{bucket_name}/{object_key}")

            # Extract session token from path (optional)
            parts = object_key.split("/")
            session_token = parts[1] if len(parts) > 1 else "default"

            # Fetch file from S3
            response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
            file_bytes = response['Body'].read()

            # Extract text
            text_content = extract_text(file_bytes, object_key)
            if not text_content:
                logger.warning(f"No text extracted from {object_key}, skipping")
                continue

            # Split text into chunks
            chunks = [text_content]
            if RecursiveCharacterTextSplitter:
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=500,
                    chunk_overlap=100,
                    separators=["\n\n", "\n", " "]
                )
                chunks = splitter.split_text(text_content)

            # Generate embeddings and upsert
            vectors_to_upsert = []
            for i, chunk in enumerate(chunks):
                embedding_result = client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=chunk,
                    config=genai.types.EmbedContentConfig(output_dimensionality=1024)
                )
                vector = embedding_result.embeddings[0].values
                vectors_to_upsert.append({
                    "id": f"{object_key}::chunk::{i}",
                    "values": vector,
                    "metadata": {"bucket": bucket_name, "file": object_key, "chunk_index": i}
                })

            if vectors_to_upsert:
                index.upsert(vectors=vectors_to_upsert, namespace=session_token)
                logger.info(f"Upserted {len(vectors_to_upsert)} vectors under namespace {session_token}")

        return {"statusCode": 200, "body": json.dumps({"message": "Processed S3 event successfully"})}

    except Exception as e:
        logger.error(f"Error: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
