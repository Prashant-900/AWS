import json

def fetch_data(event, context):
    body = {"message": "🚀 Hello from your Python Lambda function!"}
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }
