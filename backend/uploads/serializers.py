from rest_framework import serializers
from .models import UploadedFile

class UploadedFileSerializer(serializers.ModelSerializer):
    """Serializer for uploaded files"""
    
    formatted_size = serializers.ReadOnlyField()
    file_extension = serializers.ReadOnlyField()
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UploadedFile
        fields = [
            'id', 'original_filename', 'file_size', 'formatted_size',
            'content_type', 'file_type', 'file_extension',
            'created_at', 'download_url'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_download_url(self, obj):
        """Get download URL for the file"""
        try:
            from .minio_service import MinIOService
            
            # Create MinIO service instance and generate presigned URL
            minio_service = MinIOService()
            return minio_service.get_download_url(
                obj.minio_object_name,
                expiry_hours=1
            )
        except Exception as e:
            return None

class FileUploadRequestSerializer(serializers.Serializer):
    """Serializer for file upload requests"""
    
    files = serializers.ListField(
        child=serializers.FileField(),
        max_length=10,  # Maximum 10 files per upload
        allow_empty=False
    )
    message_content = serializers.CharField(
        max_length=10000, 
        required=False, 
        allow_blank=True
    )
    session_id = serializers.IntegerField()

class FileUploadResponseSerializer(serializers.Serializer):
    """Serializer for file upload response"""
    
    message_id = serializers.IntegerField()
    uploaded_files = UploadedFileSerializer(many=True)
    total_files = serializers.IntegerField()
    total_size = serializers.IntegerField()
    success = serializers.BooleanField(default=True)