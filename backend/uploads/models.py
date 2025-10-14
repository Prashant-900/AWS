from django.db import models
from django.contrib.auth.models import User
from chats.models import Message, ChatSession
import uuid

class UploadedFile(models.Model):
    """Model to store file upload information"""
    
    FILE_TYPES = [
        ('image', 'Image'),
        ('document', 'Document'),
        ('spreadsheet', 'Spreadsheet'),
        ('presentation', 'Presentation'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, related_name='files', on_delete=models.CASCADE, null=True, blank=True)
    session = models.ForeignKey(ChatSession, related_name='files', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Original file information
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()  # Size in bytes
    content_type = models.CharField(max_length=100)
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    
    # MinIO storage information
    minio_object_name = models.CharField(max_length=500)  # Path in MinIO
    minio_url = models.URLField(max_length=1000, blank=True)  # Presigned URL for access
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)
    
    # File hash for deduplication (optional)
    file_hash = models.CharField(max_length=64, blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session', 'user']),
            models.Index(fields=['message']),
            models.Index(fields=['file_hash']),
        ]
    
    def __str__(self):
        return f"{self.original_filename} ({self.file_type})"
    
    @property
    def file_extension(self):
        """Get file extension from original filename"""
        return self.original_filename.split('.')[-1].lower() if '.' in self.original_filename else ''
    
    @property
    def formatted_size(self):
        """Return human-readable file size"""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
