import React from 'react';
import { getConfig } from '../config';

const FileAttachment = ({ file }) => {
  let API_BASE_URL = 'http://localhost:8001'; // fallback
  try {
    const config = getConfig();
    API_BASE_URL = config.API_URL;
  } catch {
    // Config not loaded yet, use fallback
  }
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      case 'spreadsheet':
        return '📊';
      case 'presentation':
        return '📽️';
      case 'pdf':
        return '📕';
      case 'archive':
        return '📦';
      case 'code':
        return '💻';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileClick = async () => {
    try {
      const token = localStorage.getItem('access');
      
      // First, get the presigned download URL from backend
      const response = await fetch(`${API_BASE_URL}/uploads/download/${file.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to get download URL');
      
      const data = await response.json();
      
      // Open the file in a new tab using the presigned URL
      if (data.download_url) {
        window.open(data.download_url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No download URL received');
      }
    } catch {
      alert('Failed to open file');
    }
  };

  // For images, use the download_url from the file object (presigned URL)
  const isImage = file.file_type === 'image';
  const imageUrl = isImage && file.download_url ? file.download_url : null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderRadius: '8px',
      marginBottom: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    }}
    onClick={handleFileClick}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
    >
      {isImage && imageUrl ? (
        <div style={{
          width: '100%',
          maxWidth: '300px',
          marginBottom: '8px'
        }}>
          <img 
            src={imageUrl}
            alt={file.original_filename}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '8px',
              display: 'block'
            }}
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <>
          <span style={{
            fontSize: '24px',
            marginRight: '8px'
          }}>
            {getFileIcon(file.file_type)}
          </span>
          <div style={{
            flex: 1,
            overflow: 'hidden'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {file.original_filename}
            </div>
            <div style={{
              fontSize: '11px',
              opacity: 0.7,
              marginTop: '2px'
            }}>
              {formatFileSize(file.file_size)}
            </div>
          </div>
          <span style={{
            fontSize: '18px',
            opacity: 0.5,
            marginLeft: '8px'
          }}>
            ↗️
          </span>
        </>
      )}
    </div>
  );
};

export default FileAttachment;
