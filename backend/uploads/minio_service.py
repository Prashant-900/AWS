from datetime import timedelta
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from django.conf import settings
from decouple import config
import logging

logger = logging.getLogger(__name__)

class MinIOService:
    """Service class for S3 operations using boto3"""
    
    def __init__(self):
        # Get AWS S3 configuration from environment
        self.access_key = config('AWS_ACCESS_KEY_ID')
        self.secret_key = config('AWS_SECRET_ACCESS_KEY')
        self.region = config('AWS_REGION', default='eu-north-1')
        self.bucket_name = config('AWS_BUCKET_NAME')
        
        # Optional: For S3-compatible services (like MinIO) with custom endpoint
        self.endpoint_url = config('AWS_ENDPOINT_URL', default=None)
        
        # Initialize client as None - will be created when needed
        self.client = None
        self.s3_resource = None
    
    def _get_client(self):
        """Lazy initialization of boto3 S3 client"""
        if self.client is None:
            try:
                client_config = {
                    'aws_access_key_id': self.access_key,
                    'aws_secret_access_key': self.secret_key,
                    'region_name': self.region
                }
                
                self.client = boto3.client('s3', **client_config)
                self.s3_resource = boto3.resource('s3', **client_config)
                
                logger.info(f"✅ S3 client initialized for region: {self.region}")
                
                # Ensure bucket exists
                self._ensure_bucket_exists()
                
            except NoCredentialsError as e:
                logger.error(f"❌ AWS credentials not found: {str(e)}")
                raise e
            except Exception as e:
                logger.error(f"❌ Failed to initialize S3 client: {str(e)}")
                raise e
        
        return self.client
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist"""
        try:
            # Check if bucket exists
            self.client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"✅ S3 bucket exists: {self.bucket_name}")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                # Bucket doesn't exist, create it
                try:
                    if self.region == 'us-east-1':
                        self.client.create_bucket(Bucket=self.bucket_name)
                    else:
                        self.client.create_bucket(
                            Bucket=self.bucket_name,
                            CreateBucketConfiguration={'LocationConstraint': self.region}
                        )
                    logger.info(f"✅ Created S3 bucket: {self.bucket_name}")
                except ClientError as create_error:
                    logger.error(f"❌ Error creating bucket: {str(create_error)}")
                    raise
            else:
                logger.error(f"❌ Error checking bucket: {str(e)}")
                raise
    
    def upload_file(self, file_obj, object_name, content_type=None):
        """
        Upload file to S3
        
        Args:
            file_obj: Django UploadedFile object or file-like object
            object_name: Object name/path in S3
            content_type: MIME type
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            client = self._get_client()
            
            # Reset file pointer to beginning
            file_obj.seek(0)
            
            # Prepare extra args
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            else:
                extra_args['ContentType'] = 'application/octet-stream'
            
            # Upload file to S3
            client.upload_fileobj(
                file_obj,
                self.bucket_name,
                object_name,
                ExtraArgs=extra_args
            )
            
            logger.info(f"✅ File uploaded to S3: {object_name}")
            return True
            
        except ClientError as e:
            logger.error(f"❌ S3 upload error: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Upload error: {str(e)}")
            return False
    
    def get_download_url(self, object_name, expiry_hours=1):
        """Generate presigned URL for file download"""
        try:
            client = self._get_client()
            
            # Generate presigned URL (expires in seconds)
            url = client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': object_name
                },
                ExpiresIn=int(timedelta(hours=expiry_hours).total_seconds())
            )
            return url
        except ClientError as e:
            logger.error(f"❌ Error generating download URL: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Error generating download URL: {str(e)}")
            return None
    
    def delete_file(self, object_name):
        """Delete file from S3"""
        try:
            client = self._get_client()
            client.delete_object(Bucket=self.bucket_name, Key=object_name)
            logger.info(f"✅ File deleted from S3: {object_name}")
            return True
        except ClientError as e:
            logger.error(f"❌ Error deleting file: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Error deleting file: {str(e)}")
            return False
    
    def get_file_info(self, object_name):
        """Get file information from S3"""
        try:
            client = self._get_client()
            response = client.head_object(Bucket=self.bucket_name, Key=object_name)
            return {
                'size': response.get('ContentLength'),
                'content_type': response.get('ContentType'),
                'last_modified': response.get('LastModified'),
                'metadata': response.get('Metadata', {})
            }
        except ClientError as e:
            logger.error(f"❌ Error getting file info: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Error getting file info: {str(e)}")
            return None