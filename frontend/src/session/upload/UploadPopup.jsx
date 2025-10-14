import React, { useRef } from 'react';
import { getAllAcceptedTypes } from './uploadUtils';

/**
 * Upload popup component with file selection options
 * Positioned above the upload button
 */
const UploadPopup = ({ 
  isOpen, 
  onClose, 
  onFilesSelected, 
  error = '',
  buttonRef = null  // Reference to the upload button for positioning
}) => {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input so same file can be selected again if needed
    event.target.value = '';
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Calculate position above the upload button
  const getPopupStyle = () => {
    if (buttonRef?.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 320;
      const popupHeight = 280; // Approximate height
      
      return {
        position: 'fixed',
        bottom: `${window.innerHeight - buttonRect.top + 10}px`, // 10px above button
        left: `${Math.max(10, Math.min(buttonRect.left, window.innerWidth - popupWidth - 10))}px`,
        zIndex: 1000,
        width: `${popupWidth}px`,
        maxHeight: `${Math.min(popupHeight, buttonRect.top - 20)}px`, // Don't exceed screen top
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid #e0e0e0',
        overflow: 'auto',
        animation: 'slideUp 0.2s ease-out'
      };
    }
    
    // Fallback to bottom positioning if no button ref
    return {
      position: 'fixed',
      bottom: '80px',
      left: '20px',
      zIndex: 1000,
      width: '320px',
      maxWidth: 'calc(100vw - 40px)',
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      border: '1px solid #e0e0e0'
    };
  };

  return (
    <>
      {/* Light backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          zIndex: 999
        }}
        onClick={onClose}
      />

      {/* Popup Content */}
      <div
        style={getPopupStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Small arrow pointing to the button */}
        <div style={{
          position: 'absolute',
          bottom: '-8px',
          left: '20px',
          width: '16px',
          height: '16px',
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderTop: 'none',
          borderLeft: 'none',
          transform: 'rotate(45deg)',
          zIndex: -1
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#333'
          }}>
            Add Files
          </h3>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px',
              borderRadius: '4px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '12px',
            fontSize: '13px',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}

        {/* Upload Options */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Main Upload Option */}
          <button
            onClick={triggerFileSelect}
            style={{
              padding: '14px 16px',
              border: '2px dashed #007bff',
              borderRadius: '8px',
              backgroundColor: '#f8f9ff',
              color: '#007bff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              minHeight: '50px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e6f3ff';
              e.target.style.borderColor = '#0056b3';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f8f9ff';
              e.target.style.borderColor = '#007bff';
            }}
          >
            <span style={{ fontSize: '20px' }}>📁</span>
            <div style={{ textAlign: 'center' }}>
              <div>Add Docs / Images</div>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 'normal', 
                opacity: 0.8,
                marginTop: '2px'
              }}>
                Click to browse files
              </div>
            </div>
          </button>

          {/* File Type Info */}
          <div style={{
            fontSize: '11px',
            color: '#666',
            textAlign: 'center',
            lineHeight: '1.3'
          }}>
            <div style={{ marginBottom: '6px', fontWeight: '500' }}>
              Supported files:
            </div>
            <div style={{ marginBottom: '3px' }}>
              🖼️ Images (JPG, PNG, etc.) • 📄 Documents (PDF, Word)
            </div>
            <div>
              📊 Spreadsheets • 📽️ Presentations
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAllAcceptedTypes()}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default UploadPopup;