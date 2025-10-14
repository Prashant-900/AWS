import React from 'react';
import { formatFileSize, getFileIcon } from './uploadUtils';

/**
 * Individual file preview component
 */
const FilePreviewItem = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  
  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      margin: '4px',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      minWidth: '80px',
      maxWidth: '120px'
    }}>
      {/* Remove Button */}
      <button
        onClick={() => onRemove(file.id)}
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#dc3545';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        }}
        title="Remove file"
      >
        ×
      </button>

      {/* File Preview */}
      <div style={{
        padding: '8px',
        textAlign: 'center',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {isImage && file.preview ? (
          <img
            src={file.preview}
            alt={file.name}
            style={{
              width: '100%',
              height: '60px',
              objectFit: 'cover',
              borderRadius: '4px',
              marginBottom: '4px'
            }}
          />
        ) : (
          <div style={{
            fontSize: '32px',
            marginBottom: '4px',
            opacity: 0.8
          }}>
            {getFileIcon(file.name)}
          </div>
        )}
        
        {/* File Name */}
        <div style={{
          fontSize: '11px',
          color: '#333',
          fontWeight: '500',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: '2px'
        }} title={file.name}>
          {file.name}
        </div>
        
        {/* File Size */}
        <div style={{
          fontSize: '10px',
          color: '#666',
          opacity: 0.8
        }}>
          {formatFileSize(file.size)}
        </div>
      </div>

      {/* Upload Status Indicator */}
      {file.uploading && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          backgroundColor: '#007bff',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      )}
      
      {file.error && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#dc3545',
          color: 'white',
          fontSize: '9px',
          padding: '2px 4px',
          textAlign: 'center'
        }}>
          Error
        </div>
      )}
    </div>
  );
};

/**
 * Main file preview container component
 */
const FilePreview = ({ files, onRemoveFile, onClearAll }) => {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div style={{
      marginBottom: '12px',
      padding: '12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#333'
        }}>
          📎 {files.length} file{files.length !== 1 ? 's' : ''} attached
        </span>
        
        {files.length > 1 && (
          <button
            onClick={onClearAll}
            style={{
              fontSize: '11px',
              color: '#dc3545',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8d7da';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* File Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        maxHeight: '200px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {files.map(file => (
          <FilePreviewItem
            key={file.id}
            file={file}
            onRemove={onRemoveFile}
          />
        ))}
      </div>

      {/* Upload Instructions */}
      <div style={{
        fontSize: '11px',
        color: '#666',
        marginTop: '8px',
        textAlign: 'center',
        opacity: 0.8
      }}>
        Files will be attached to your message when sent
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default FilePreview;