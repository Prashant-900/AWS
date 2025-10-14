from django.urls import re_path
from .consumers.base_consumer import ChatConsumer

websocket_urlpatterns = [
    # WebSocket endpoint for chat - expects UUID session_token
    re_path(r'ws/chat/(?P<session_token>[0-9a-f-]{36})/$', ChatConsumer.as_asgi()),
]