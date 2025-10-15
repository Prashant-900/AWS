import os
import hashlib
import uuid
from datetime import datetime, timedelta
from minio import Minio
from minio.error import S3Error
from django.conf import settings
from decouple import config
import logging
import asyncio
import aiohttp

logger = logging.getLogger(__name__)

class MinIOService:
    """Service class for MinIO operations"""
    
    def __init__(self):
        # Get MinIO configuration from environment
        self.endpoint = config('MINIO_ENDPOINT')
        self.access_key = config('MINIO_ACCESS_KEY')
        self.secret_key = config('MINIO_SECRET_KEY')
        self.secure = config('MINIO_SECURE', cast=bool)
        self.bucket_name = config('MINIO_BUCKET_NAME')
        
        # Initialize client as None - will be created when needed
        self.client = None
    
    def _get_client(self):
        """Lazy initialization of MinIO client"""
        if self.client is None:
            try:
                self.client = Minio(
                    self.endpoint,
                    access_key=self.access_key,
                    secret_key=self.secret_key,
                    secure=self.secure
                )
                logger.info(f"✅ MinIO client initialized: {self.endpoint}")
                
                # Ensure bucket exists
                self._ensure_bucket_exists()
                
            except Exception as e:
                logger.error(f"❌ Failed to initialize MinIO client: {str(e)}")
                raise e
        
        return self.client
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"✅ Created MinIO bucket: {self.bucket_name}")
            else:
                logger.info(f"✅ MinIO bucket exists: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"❌ Error ensuring bucket exists: {str(e)}")
            raise

    async def _trigger_lambda(self, bucket_name, object_name):
        """Asynchronously notify Lambda about uploaded file"""
        lambda_url = "http://127.0.0.1:3000/hello"  # change to your Lambda URL if needed

        payload = {
            "Records": [
                {
                    "s3": {
                        "bucket": {"name": bucket_name},
                        "object": {"key": object_name}
                    }
                }
            ]
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(lambda_url, json=payload) as response:
                    result = await response.text()
                    print(f"📡 Lambda notified for {object_name} → {response.status}: {result}")
        except Exception as e:
            print(f"❌ Failed to notify Lambda: {str(e)}")
    
    def upload_file(self, file_obj, object_name,content_type=None):
        """
        Upload file to MinIO
        
        Args:
            file_obj: Django UploadedFile object or file-like object
            object_name: Object name/path in MinIO
            content_type: MIME type
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            client = self._get_client()
            
            # Reset file pointer to beginning
            file_obj.seek(0)
            
            client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=file_obj,
                length=file_obj.size,
                content_type=content_type or 'application/octet-stream'
            )
            
            logger.info(f"✅ File uploaded to MinIO: {object_name}")
            asyncio.run(self._trigger_lambda(self.bucket_name, object_name))
            return True
            
        except S3Error as e:
            logger.error(f"❌ MinIO upload error: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Upload error: {str(e)}")
            return False
    
    def get_download_url(self, object_name, expiry_hours=1):
        """Generate presigned URL for file download"""
        try:
            client = self._get_client()
            
            url = client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                expires=timedelta(hours=expiry_hours)
            )
            return url
        except S3Error as e:
            logger.error(f"❌ Error generating download URL: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Error generating download URL: {str(e)}")
            return None
    
    def delete_file(self, object_name):
        """Delete file from MinIO"""
        try:
            client = self._get_client()
            client.remove_object(self.bucket_name, object_name)
            logger.info(f"✅ File deleted from MinIO: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"❌ Error deleting file: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Error deleting file: {str(e)}")
            return False
    
    def get_file_info(self, object_name):
        """Get file information from MinIO"""
        try:
            client = self._get_client()
            stat = client.stat_object(self.bucket_name, object_name)
            return {
                'size': stat.size,
                'content_type': stat.content_type,
                'last_modified': stat.last_modified,
                'metadata': stat.metadata
            }
        except S3Error as e:
            logger.error(f"❌ Error getting file info: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Error getting file info: {str(e)}")
            return None