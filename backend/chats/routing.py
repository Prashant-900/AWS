from django.urls import re_path
from .consumers.chat_consumer import ChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<session_token>[^/]+)/$', ChatConsumer.as_asgi()),
]