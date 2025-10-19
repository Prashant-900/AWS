from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import StreamingHttpResponse
from .models import ChatSession, Message
from .serializers import ChatSessionSerializer, MessageSerializer
import json
import requests
import os
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sessions(request):
    """Get all chat sessions for the authenticated user"""
    sessions = ChatSession.objects.filter(user=request.user).order_by('-created_at')
    serializer = ChatSessionSerializer(sessions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    """Create a new chat session with a random UUID token"""
    try:
        data = json.loads(request.body) if request.body else {}
        session_name = data.get('session_name', 'New Chat')
        
        session = ChatSession.objects.create(
            user=request.user,
            session_name=session_name
        )
        
        serializer = ChatSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_messages(request, session_token):
    """Get all messages for a specific session using session_token"""
    try:
        session = ChatSession.objects.get(session_token=session_token, user=request.user)
        messages = Message.objects.filter(session=session).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    except ChatSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_session(request, session_token):
    """Delete a chat session and all its messages"""
    try:
        session = ChatSession.objects.get(session_token=session_token, user=request.user)
        session.delete()
        return Response({'message': 'Session deleted successfully'}, status=status.HTTP_200_OK)
    except ChatSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stream_chat(request, session_token):
    """Stream chat response from the agent service"""
    try:
        # Verify session exists and belongs to user
        session = ChatSession.objects.get(session_token=session_token, user=request.user)
        
        # Get message from request
        data = json.loads(request.body) if request.body else {}
        message = data.get('message', '').strip()
        
        if not message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save user message
        user_message = Message.objects.create(
            session=session,
            sender='user',
            content=message,
            timestamp=timezone.now()
        )
        
        # Agent service URL
        agent_url = os.getenv('AGENT_SERVICE_URL')
        
        def stream_generator():
            try:
                # Call the FastAPI agent streaming endpoint
                response = requests.post(
                    f'{agent_url}/chat/stream',
                    data={
                        'session_token': str(session_token),
                        'message': message
                    },
                    stream=True,
                    timeout=60
                )
                
                if response.status_code != 200:
                    yield f"data: {json.dumps({'error': 'Agent service error', 'type': 'error'})}\n\n"
                    return
                
                full_response = ""
                
                # Stream the response from FastAPI
                for line in response.iter_lines():
                    if line:
                        line = line.decode('utf-8')
                        if line.startswith('data: '):
                            data_content = line[6:]  # Remove 'data: ' prefix
                            try:
                                chunk_data = json.loads(data_content)
                                if chunk_data.get('type') == 'chunk':
                                    content = chunk_data.get('content', '')
                                    full_response += content
                                    yield f"data: {json.dumps({'content': content, 'type': 'chunk'})}\n\n"
                                elif chunk_data.get('type') == 'end':
                                    # Save AI response to database
                                    ai_message = Message.objects.create(
                                        session=session,
                                        sender='ai',
                                        content=full_response,
                                        timestamp=timezone.now()
                                    )
                                    
                                    yield f"data: {json.dumps({'type': 'end', 'message_id': ai_message.id, 'full_content': full_response})}\n\n"
                                elif chunk_data.get('type') == 'error':
                                    yield f"data: {json.dumps(chunk_data)}\n\n"
                            except json.JSONDecodeError:
                                continue
                
            except requests.exceptions.RequestException as e:
                yield f"data: {json.dumps({'error': f'Connection error: {str(e)}', 'type': 'error'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': f'Unexpected error: {str(e)}', 'type': 'error'})}\n\n"
        
        return StreamingHttpResponse(
            stream_generator(),
            content_type='text/plain',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'X-Accel-Buffering': 'no',  # Disable nginx buffering
            }
        )
        
    except ChatSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
