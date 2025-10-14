from django.urls import path
from . import views

urlpatterns = [
    # Get all sessions for user
    path('', views.get_sessions, name='get_sessions'),
    
    # Create new session
    path('create/', views.create_session, name='create_session'),
    
    # Get messages for a specific session
    path('<uuid:session_token>/messages/', views.get_session_messages, name='get_session_messages'),
    
    # Delete a session
    path('<uuid:session_token>/delete/', views.delete_session, name='delete_session'),
]