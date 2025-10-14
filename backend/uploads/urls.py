from django.urls import path
from . import views

app_name = 'uploads'

urlpatterns = [
    # File upload endpoint (requires session_token in request body)
    path('upload/', views.FileUploadView.as_view(), name='file_upload'),
    
    # File download endpoint
    path('download/<uuid:file_id>/', views.FileDownloadView.as_view(), name='file_download'),
    
    # File delete endpoint
    path('delete/<uuid:file_id>/', views.FileDeleteView.as_view(), name='file_delete'),
    
    # List files for a specific session
    path('session/<uuid:session_token>/files/', views.SessionFilesView.as_view(), name='session_files'),
]