import React, { useRef } from 'react';
import { UploadButton, UploadPopup, FilePreview, useFileUpload } from './upload';

const MessageInput = ({ 
  newMessage, 
  onMessageChange, 
  onSubmit,
  sessionToken = null, // Session token for file uploads
  onFileUploadSuccess = null // Callback when files are uploaded successfully
}) => {
  const uploadButtonRef = useRef(null);
  const {
    uploadedFiles, 
    isUploadPopupOpen, 
    uploadError, 
    isUploading, 
    addFiles, 
    removeFile, 
    clearAllFiles, 
    toggleUploadPopup, 
    closeUploadPopup, 
    uploadFilesToServer 
  } = useFileUpload();

  // When files are selected in the popup we want to add them to the composer and start upload immediately
  const handleFilesSelected = async (files) => {
    // addFiles returns the newly created wrappers
    const newWrappers = addFiles(files) || [];

    if (newWrappers.length === 0) {
      return;
    }

    if (!sessionToken) {
      return;
    }

    try {
      const result = await uploadFilesToServer(sessionToken, '', newWrappers);

      if (result.success) {
        
        // Clear uploaded files from preview
        clearAllFiles();
        
        // Notify parent if backend returned a message representing the uploaded files
        if (onFileUploadSuccess && result.data?.user_message) {
          onFileUploadSuccess(result.data.user_message);
        }
      }
    } catch {
      //
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isUploading) return; // Prevent multiple submissions
    
    const messageText = newMessage.trim();
    
    // Require text to send
    if (!messageText) {
      return;
    }
    
    // Send the text-only message via WebSocket
    onSubmit(e, {
      message: messageText,
      files: []
    });
    
    // Clear input after sending
    onMessageChange({ target: { value: '' } });
  };

  // Only check for text content, not files (files require text to send)
  const hasContent = newMessage.trim();

  return (
    <div style={{ 
      backgroundColor: 'white',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* File Preview Area */}
      <FilePreview
        files={uploadedFiles}
        onRemoveFile={removeFile}
        onClearAll={clearAllFiles}
      />

      {/* Input Area */}
      <div style={{ 
        padding: '20px', 
        borderTop: uploadedFiles.length > 0 ? 'none' : '1px solid #ddd'
      }}>
        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', 
          gap: '10px',
          alignItems: 'flex-end'
        }}>
          {/* Upload Button */}
          <UploadButton 
            ref={uploadButtonRef}
            onClick={toggleUploadPopup}
            disabled={false}
          />

          {/* Text Input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={newMessage}
              onChange={onMessageChange}
              placeholder="Type your message..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '25px',
                outline: 'none',
                fontSize: '14px',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#007bff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ddd';
              }}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!hasContent || isUploading}
            style={{
              padding: '12px 24px',
              backgroundColor: hasContent && !isUploading ? '#007bff' : '#f5f5f5',
              color: hasContent && !isUploading ? 'white' : '#999',
              border: 'none',
              borderRadius: '25px',
              cursor: hasContent && !isUploading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '70px'
            }}
            onMouseEnter={(e) => {
              if (hasContent && !isUploading) {
                e.target.style.backgroundColor = '#0056b3';
              }
            }}
            onMouseLeave={(e) => {
              if (hasContent && !isUploading) {
                e.target.style.backgroundColor = '#007bff';
              }
            }}
          >
            {isUploading ? 'Uploading...' : 'Send'}
          </button>
        </form>

        {/* File count indicator */}
        {uploadedFiles.length > 0 && (
          <div style={{
            fontSize: '12px',
            color: isUploading ? '#007bff' : '#666',
            marginTop: '8px',
            textAlign: 'center'
          }}>
            {isUploading 
              ? `Uploading ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}...`
              : `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''} ready to send`
            }
          </div>
        )}
      </div>

      {/* Upload Popup */}
      <UploadPopup
        isOpen={isUploadPopupOpen}
        onClose={closeUploadPopup}
        onFilesSelected={handleFilesSelected}
        error={uploadError}
        buttonRef={uploadButtonRef}
      />
    </div>
  );
};

export default MessageInput;