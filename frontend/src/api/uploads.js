import api from '../api';

export const uploadFiles = async (files, sessionToken, messageText = '') => {
  try {
    if (!sessionToken) {
      throw new Error('sessionToken is required');
    }

    const formData = new FormData();
    
    // Add files to FormData
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add session token (required)
    formData.append('session_token', sessionToken);
    
    // Add message text if provided
    if (messageText && messageText.trim()) {
      formData.append('message_text', messageText.trim());
    }
    
    const response = await api.post('/uploads/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to upload files'
    };
  }
};

export const getFileDownloadUrl = async (fileId) => {
  try {
    const response = await api.get(`/uploads/download/${fileId}/`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get download URL error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get download URL'
    };
  }
};

export const deleteFile = async (fileId) => {
  try {
    const response = await api.delete(`/uploads/delete/${fileId}/`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Delete file error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete file'
    };
  }
};

export const getSessionFiles = async (sessionToken, options = {}) => {
  try {
    if (!sessionToken) {
      throw new Error('sessionToken is required');
    }

    const params = new URLSearchParams();
    
    if (options.fileType) params.append('file_type', options.fileType);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/uploads/session/${sessionToken}/files/${queryString}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get session files error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get files'
    };
  }
};