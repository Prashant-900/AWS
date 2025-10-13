from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_sessions),
    path('create/', views.create_session),
    path('<int:session_id>/messages/', views.get_session_messages),
    path('message/save/', views.save_message),
    # send_message endpoint removed - using WebSocket only for real-time messaging
]