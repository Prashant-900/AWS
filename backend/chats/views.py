from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ChatSession, Message
from .serializers import ChatSessionSerializer, MessageSerializer
import json

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
