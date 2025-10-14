from rest_framework import serializers
from .models import ChatSession, Message

class MessageSerializer(serializers.ModelSerializer):
    files = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp', 'files']
    
    def get_files(self, obj):
        # Import here to avoid circular import
        from uploads.serializers import UploadedFileSerializer
        return UploadedFileSerializer(obj.files.all(), many=True).data

class ChatSessionSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['session_token', 'session_name', 'created_at', 'message_count']
        read_only_fields = ['session_token', 'created_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()