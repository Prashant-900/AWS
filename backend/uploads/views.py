import uuid
import logging
import json
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.exceptions import ValidationError
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import UploadedFile
from .serializers import UploadedFileSerializer
from .minio_service import MinIOService
from .utils import validate_file_upload, format_file_size
from chats.models import Message, ChatSession

logger = logging.getLogger(__name__)

class FileUploadView(APIView):
    """Handle file uploads for a specific chat session with optional text message"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def post(self, request):
        """Upload files to session-specific folder in MinIO and create message"""
        try:
            files = request.FILES.getlist('files', [])
            session_token = request.data.get('session_token')
            message_text = request.data.get('message_text', '').strip()
            
            # Require either files or text
            if not files and not message_text:
                return Response(
                    {'error': 'Either files or message text is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not session_token:
                return Response(
                    {'error': 'session_token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate session
            try:
                session = ChatSession.objects.get(session_token=session_token, user=request.user)
            except ChatSession.DoesNotExist:
                return Response(
                    {'error': 'Session not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            uploaded_files = []
            minio_service = MinIOService()
            user_message = None
            
            # Process uploaded files and create message
            with transaction.atomic():
                # Create user message first (if there's text or files)
                if message_text or files:
                    # Build message content
                    if message_text:
                        content = message_text
                    else:
                        # If only files, create a generic message
                        file_count = len(files)
                        content = f"Shared {file_count} file{'s' if file_count > 1 else ''}"
                    
                    user_message = Message.objects.create(
                        session=session,
                        sender='user',
                        content=content
                    )
                    logger.info(f"Created user message: {user_message.id}")
                
                # Upload files if any
                for file in files:
                    try:
                        # Validate file
                        file_info = validate_file_upload(file)
                        
                        # Generate unique filename
                        file_id = str(uuid.uuid4())
                        original_name = file.name
                        file_extension = '.' + original_name.split('.')[-1] if '.' in original_name else ''
                        minio_filename = f"{file_id}{file_extension}"
                        
                        # Upload to MinIO with session-based folder structure
                        object_name = f"uploads/{session_token}/{minio_filename}"
                        upload_result = minio_service.upload_file(
                            file_obj=file,
                            object_name=object_name,
                            content_type=file_info['content_type']
                        )
                        
                        if not upload_result:
                            raise Exception(f"Failed to upload {original_name} to storage")
                        
                        # Create database record and link to message
                        uploaded_file = UploadedFile.objects.create(
                            user=request.user,
                            session=session,
                            message=user_message,  # Link file to message
                            original_filename=original_name,
                            minio_object_name=object_name,
                            file_type=file_info['file_type'],
                            content_type=file_info['content_type'],
                            file_size=file_info['size']
                        )
                        
                        uploaded_files.append(uploaded_file)
                        
                        logger.info(f"File uploaded successfully: {original_name} -> {object_name}")
                        
                    except ValidationError as e:
                        return Response(
                            {'error': f"File validation failed for {file.name}: {str(e)}"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    except Exception as e:
                        logger.error(f"Error uploading file {file.name}: {str(e)}")
                        return Response(
                            {'error': f"Failed to upload {file.name}: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
            
            # Prepare response
            response_data = {
                'message': 'Upload successful',
                'files': UploadedFileSerializer(uploaded_files, many=True).data,
                'session_token': str(session_token)
            }
            
            if user_message:
                from chats.serializers import MessageSerializer
                response_data['user_message'] = MessageSerializer(user_message).data
                
                # Broadcast the message to WebSocket clients in this session
                try:
                    channel_layer = get_channel_layer()
                    message_data = MessageSerializer(user_message).data
                    
                    async_to_sync(channel_layer.group_send)(
                        f'chat_{session_token}',
                        {
                            'type': 'chat_message',
                            'message': message_data
                        }
                    )
                    logger.info(f"Broadcasted file upload message to session {session_token}")
                except Exception as e:
                    logger.error(f"Failed to broadcast message via WebSocket: {str(e)}")
                    # Don't fail the request if WebSocket broadcast fails
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Unexpected error in file upload: {str(e)}")
            return Response(
                {'error': 'Internal server error during upload'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileDownloadView(APIView):
    """Generate download URLs for uploaded files"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, file_id):
        """Get presigned download URL for file"""
        try:
            # Get file record
            uploaded_file = UploadedFile.objects.get(
                id=file_id,
                user=request.user
            )
            
            # Generate presigned URL
            minio_service = MinIOService()
            download_url = minio_service.get_download_url(
                object_name=uploaded_file.minio_object_name,
                expiry_hours=1  # URL valid for 1 hour
            )
            
            if not download_url:
                return Response(
                    {'error': 'Failed to generate download URL'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response({
                'download_url': download_url,
                'filename': uploaded_file.original_filename,
                'file_type': uploaded_file.file_type,
                'file_size': format_file_size(uploaded_file.file_size),
                'expires_in': '1 hour'
            })
            
        except UploadedFile.DoesNotExist:
            return Response(
                {'error': 'File not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error generating download URL: {str(e)}")
            return Response(
                {'error': 'Failed to generate download URL'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileDeleteView(APIView):
    """Delete uploaded files"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, file_id):
        """Delete file from storage and database"""
        try:
            # Get file record
            uploaded_file = UploadedFile.objects.get(
                id=file_id,
                user=request.user
            )
            
            # Delete from MinIO
            minio_service = MinIOService()
            delete_result = minio_service.delete_file(uploaded_file.minio_object_name)
            
            if not delete_result:
                logger.warning(f"Failed to delete file from MinIO: {uploaded_file.minio_object_name}")
            
            # Delete from database
            uploaded_file.delete()
            
            return Response({
                'message': 'File deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except UploadedFile.DoesNotExist:
            return Response(
                {'error': 'File not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return Response(
                {'error': 'Failed to delete file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SessionFilesView(APIView):
    """List files for a specific session"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, session_token):
        """Get list of files for a specific session"""
        try:
            # Validate session
            try:
                session = ChatSession.objects.get(session_token=session_token, user=request.user)
            except ChatSession.DoesNotExist:
                return Response(
                    {'error': 'Session not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get query parameters
            file_type = request.query_params.get('file_type')
            limit = int(request.query_params.get('limit', 50))
            offset = int(request.query_params.get('offset', 0))
            
            # Build query
            queryset = UploadedFile.objects.filter(session=session)
            
            if file_type:
                queryset = queryset.filter(file_type=file_type)
            
            # Order by most recent first
            queryset = queryset.order_by('-created_at')
            
            # Apply pagination
            total_count = queryset.count()
            files = queryset[offset:offset + limit]
            
            return Response({
                'files': UploadedFileSerializer(files, many=True).data,
                'session_token': str(session_token),
                'total_count': total_count,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total_count
            })
            
        except Exception as e:
            logger.error(f"Error listing session files: {str(e)}")
            return Response(
                {'error': 'Failed to list files'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
