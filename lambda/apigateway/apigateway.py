import json

def fetch_data(event, context):
    print("✅ Lambda triggered")

    try:
        if isinstance(event, str):
            event = json.loads(event)

        if "Records" in event:
            for record in event["Records"]:
                bucket_name = record["s3"]["bucket"]["name"]
                object_key = record["s3"]["object"]["key"]
                print(f"🪣 Bucket: {bucket_name}")
                print(f"📄 File uploaded: {object_key}")

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Lambda processed MinIO event"})
        }
    except Exception as e:
        print("❌ Error:", str(e))
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
