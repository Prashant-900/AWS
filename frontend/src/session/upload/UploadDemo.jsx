import React, { useState, useRef } from 'react';
import { UploadButton, UploadPopup, FilePreview, useFileUpload } from './';

/**
 * Demo component to test upload functionality
 * This can be used for development and testing
 */
const UploadDemo = () => {
  const [message, setMessage] = useState('');
  const uploadButtonRef = useRef(null);
  const {
    uploadedFiles,
    isUploadPopupOpen,
    uploadError,
    addFiles,
    removeFile,
    clearAllFiles,
    toggleUploadPopup,
    closeUploadPopup
  } = useFileUpload();

  const handleSend = () => {

    
    // Clear everything after sending
    setMessage('');
    clearAllFiles();
    alert('Message sent! Check console for details.');
  };

  const hasContent = message.trim() || uploadedFiles.length > 0;

  return (
    <div style={{
      maxWidth: '600px',
      margin: '20px auto',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3 style={{ marginTop: 0 }}>File Upload Demo</h3>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* File Preview */}
        <FilePreview
          files={uploadedFiles}
          onRemoveFile={removeFile}
          onClearAll={clearAllFiles}
        />

        {/* Input Area */}
        <div style={{ 
          padding: '16px',
          borderTop: uploadedFiles.length > 0 ? '1px solid #eee' : 'none'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            alignItems: 'flex-end'
          }}>
            <UploadButton ref={uploadButtonRef} onClick={toggleUploadPopup} />
            
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '25px',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            
            <button
              onClick={handleSend}
              disabled={!hasContent}
              style={{
                padding: '12px 24px',
                backgroundColor: hasContent ? '#007bff' : '#f5f5f5',
                color: hasContent ? 'white' : '#999',
                border: 'none',
                borderRadius: '25px',
                cursor: hasContent ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      {uploadedFiles.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#e7f3ff',
          border: '1px solid #007bff',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#0056b3'
        }}>
          📎 {uploadedFiles.length} file(s) selected
        </div>
      )}

      {/* Upload Popup */}
      <UploadPopup
        isOpen={isUploadPopupOpen}
        onClose={closeUploadPopup}
        onFilesSelected={addFiles}
        error={uploadError}
        buttonRef={uploadButtonRef}
      />
    </div>
  );
};

export default UploadDemo;