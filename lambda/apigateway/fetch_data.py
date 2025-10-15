import json
import os
from minio import Minio
from pinecone import Pinecone
from io import BytesIO
import pdfplumber
import docx2txt
from dotenv import load_dotenv
from google import genai

load_dotenv()

print("🔹 Initializing clients...")

# Initialize MinIO client
minio_client = Minio(
    endpoint=os.environ["MINIO_ENDPOINT"],
    access_key=os.environ["MINIO_ACCESS_KEY"],
    secret_key=os.environ["MINIO_SECRET_KEY"],
    secure=False
)
print("✅ MinIO client initialized")

# Initialize Google Gemini client
client = genai.Client()
print("✅ Google Gemini client initialized")

# Initialize Pinecone
pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index_name = "vector-db"
index = pc.Index(index_name)
print(f"✅ Pinecone index '{index_name}' initialized")


def extract_text(file_bytes, filename):
    print(f"🔹 Extracting text from {filename}")
    if filename.lower().endswith(".txt"):
        text = file_bytes.decode("utf-8")
        print(f"✅ Extracted text from {filename} (TXT)")
        return text
    elif filename.lower().endswith(".pdf"):
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            text = "\n".join([page.extract_text() or "" for page in pdf.pages])
            print(f"✅ Extracted text from {filename} (PDF)")
            return text
    elif filename.lower().endswith(".docx"):
        text = docx2txt.process(BytesIO(file_bytes))
        print(f"✅ Extracted text from {filename} (DOCX)")
        return text
    else:
        print(f"❌ Unsupported file type: {filename}")
        return None


def fetch_data(event, context):
    print("✅ Lambda triggered")
    print("Event received:", event)

    try:
        # Parse body if coming from API Gateway
        body = event.get("body")
        if isinstance(body, str):
            body = json.loads(body)
        print("🔹 Event body parsed")

        if "Records" not in body:
            print("⚠️ No Records found in event body")
            return {"statusCode": 400, "body": json.dumps({"error": "No Records in event body"})}

        for record in body["Records"]:
            print("🔹 Processing new record")
            bucket_name = record["s3"]["bucket"]["name"]
            object_key = record["s3"]["object"]["key"]
            print(f"🪣 Bucket: {bucket_name}")
            print(f"📄 File uploaded: {object_key}")

            # Extract session_token from path
            parts = object_key.split("/")
            if len(parts) < 3:
                print("❌ Invalid path format, skipping file")
                continue
            session_token = parts[1]
            print(f"🔹 Session token: {session_token}")

            # Fetch file content from MinIO
            print(f"⏳ Fetching file {object_key} from MinIO...")
            response = minio_client.get_object(bucket_name, object_key)
            file_bytes = response.read()
            response.close()
            response.release_conn()
            print(f"✅ File {object_key} fetched successfully")

            # Extract text
            text_content = extract_text(file_bytes, object_key)
            if not text_content:
                print(f"❌ No text extracted from {object_key}, skipping")
                continue

            # Generate 1024-d embedding using Gemini API
            print(f"⏳ Generating 1024-d embedding for {object_key}...")
            embedding_result = client.models.embed_content(
                model="gemini-embedding-001",
                contents=text_content,
                config=genai.types.EmbedContentConfig(output_dimensionality=1024)
            )
            vector = embedding_result.embeddings[0].values
            print(f"✅ Embedding generated for {object_key} (Length: {len(vector)})")

            # Upsert into Pinecone
            print(f"⏳ Upserting vector into Pinecone namespace '{session_token}'...")
            index.upsert(
                vectors=[
                    {
                        "id": object_key,
                        "values": vector,
                        "metadata": {"bucket": bucket_name, "file": object_key}
                    }
                ],
                namespace=session_token
            )
            print(f"✅ File {object_key} embedded and uploaded under namespace {session_token}")

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Lambda processed MinIO event successfully"})
        }

    except Exception as e:
        print("❌ Error:", str(e))
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
