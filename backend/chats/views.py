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
    sessions = ChatSession.objects.filter(user=request.user).order_by('-created_at')
    serializer = ChatSessionSerializer(sessions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    try:
        data = json.loads(request.body)
        session_name = data.get('session_name', 'New Chat')
        
        session = ChatSession.objects.create(
            user=request.user,
            session_name=session_name
        )
        
        serializer = ChatSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_message(request):
    try:
        data = json.loads(request.body)
        session_id = data.get('session_id')
        sender = data.get('sender')  # 'user' or 'ai'
        content = data.get('content')
        
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        
        message = Message.objects.create(
            session=session,
            sender=sender,
            content=content
        )
        
        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    try:
        data = json.loads(request.body)
        session_id = data.get('session_id')
        content = data.get('content')
        
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Save user message
        user_message = Message.objects.create(
            session=session,
            sender='user',
            content=content
        )
        
        # Generate AI response (for now just return "hello")
        ai_response = "Hello! I'm an AI assistant. How can I help you today?"
        
        # Save AI message
        ai_message = Message.objects.create(
            session=session,
            sender='ai',
            content=ai_response
        )
        
        # Return both messages
        user_serializer = MessageSerializer(user_message)
        ai_serializer = MessageSerializer(ai_message)
        
        return Response({
            'user_message': user_serializer.data,
            'ai_message': ai_serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_messages(request, session_id):
    try:
        session = ChatSession.objects.get(id=session_id, user=request.user)
        messages = Message.objects.filter(session=session).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    except ChatSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
