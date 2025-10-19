import React, { useState } from 'react';

/**
 * Image View Component  
 * Displays images from URLs with download functionality
 */
const ImageView = ({ content, isStreaming, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Extract URL from content (remove any surrounding text)
  const imageUrl = content.trim();
  
  const handleCopy = () => {
    if (onCopy) {
      onCopy(imageUrl);
    } else {
      navigator.clipboard.writeText(imageUrl);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Try to get filename from URL or use default
      const urlPath = new URL(imageUrl).pathname;
      const filename = urlPath.split('/').pop() || 'image';
      const extension = filename.includes('.') ? '' : '.jpg';
      
      link.download = filename + extension;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch  {
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return string.startsWith('http://') || string.startsWith('https://') || string.startsWith('data:');
    } catch {
      return false;
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  return (
    <div className="image-view">
      <div className="image-header">
        <div className="header-left">
          <span className="format-tag">IMAGE</span>
          {imageError && (
            <span className="error-indicator" title="Failed to load image">⚠️</span>
          )}
          {imageLoaded && !imageError && (
            <span className="success-indicator" title="Image loaded successfully">✅</span>
          )}
        </div>
        
        <div className="header-actions">
          {!isStreaming && isValidUrl(imageUrl) && !imageError && (
            <button 
              className="download-button"
              onClick={handleDownload}
              title="Download image"
            >
              💾 Download
            </button>
          )}
          {!isStreaming && (
            <button 
              className="copy-button"
              onClick={handleCopy}
              title="Copy image URL"
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          )}
        </div>
      </div>
      
      <div className="image-content">
        {isStreaming ? (
          <div className="streaming-image">
            <div className="streaming-info">
              <span>Loading image URL...</span>
            </div>
            <div className="url-preview">
              {imageUrl}
              <span className="streaming-cursor">▌</span>
            </div>
          </div>
        ) : !isValidUrl(imageUrl) ? (
          <div className="invalid-url">
            <div className="error-icon">🖼️⚠️</div>
            <div className="error-title">Invalid Image URL</div>
            <div className="error-message">
              The provided content is not a valid image URL
            </div>
            <div className="provided-content">
              <strong>Provided content:</strong>
              <pre>{imageUrl}</pre>
            </div>
          </div>
        ) : (
          <div className="image-container">
            <div className="url-display">
              <span className="url-label">URL:</span>
              <span className="url-text">{imageUrl}</span>
            </div>
            
            <div className="image-wrapper">
              {!imageLoaded && !imageError && (
                <div className="loading-placeholder">
                  <div className="loading-spinner">⏳</div>
                  <div className="loading-text">Loading image...</div>
                </div>
              )}
              
              {imageError && (
                <div className="error-placeholder">
                  <div className="error-icon">🖼️❌</div>
                  <div className="error-title">Failed to Load Image</div>
                  <div className="error-message">
                    The image could not be loaded. This might be due to:
                  </div>
                  <ul className="error-reasons">
                    <li>Invalid or broken URL</li>
                    <li>Network connectivity issues</li>
                    <li>CORS restrictions</li>
                    <li>Unsupported image format</li>
                  </ul>
                  <button 
                    className="retry-button"
                    onClick={() => {
                      setImageError(false);
                      setImageLoaded(false);
                    }}
                  >
                    🔄 Retry
                  </button>
                </div>
              )}
              
              <img
                src={imageUrl}
                alt="AI Generated Image"
                className={`main-image ${imageLoaded ? 'loaded' : ''} ${imageError ? 'hidden' : ''}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .image-view {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          margin: 8px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
        }
        
        .image-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #fef7ff;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .format-tag {
          color: #a21caf;
          font-size: 12px;
          font-weight: 600;
        }
        
        .error-indicator, .success-indicator {
          font-size: 14px;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .download-button, .copy-button {
          background: #fae8ff;
          color: #a21caf;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .download-button:hover, .copy-button:hover {
          background: #f3e8ff;
          color: #86198f;
        }
        
        .image-content {
          padding: 16px;
        }
        
        .streaming-image {
          text-align: center;
          padding: 20px;
        }
        
        .streaming-info {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 12px;
          font-style: italic;
        }
        
        .url-preview {
          background: #1e293b;
          color: #f1f5f9;
          padding: 12px;
          border-radius: 6px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          word-wrap: break-word;
        }
        
        .streaming-cursor {
          color: #a21caf;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .invalid-url {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: 20px;
          text-align: center;
          color: #dc2626;
          background: #fef2f2;
        }
        
        .error-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        
        .error-title {
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .error-message {
          font-size: 14px;
          color: #7f1d1d;
          margin-bottom: 16px;
        }
        
        .provided-content {
          text-align: left;
          width: 100%;
          max-width: 400px;
        }
        
        .provided-content pre {
          background: #f7f7f7;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
          margin: 4px 0 0 0;
          color: #374151;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
        
        .image-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .url-display {
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          font-size: 13px;
          word-wrap: break-word;
        }
        
        .url-label {
          font-weight: 600;
          color: #374151;
          margin-right: 8px;
        }
        
        .url-text {
          color: #6b7280;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }
        
        .image-wrapper {
          position: relative;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 8px;
          border: 2px dashed #e2e8f0;
        }
        
        .loading-placeholder, .error-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
        }
        
        .loading-placeholder {
          color: #6b7280;
        }
        
        .error-placeholder {
          color: #dc2626;
        }
        
        .loading-spinner {
          font-size: 24px;
          margin-bottom: 8px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .loading-text {
          font-size: 14px;
        }
        
        .error-reasons {
          text-align: left;
          font-size: 12px;
          color: #7f1d1d;
          margin: 8px 0 16px 0;
        }
        
        .error-reasons li {
          margin-bottom: 2px;
        }
        
        .retry-button {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .retry-button:hover {
          background: #fecaca;
          border-color: #f87171;
        }
        
        .main-image {
          max-width: 100%;
          max-height: 500px;
          width: auto;
          height: auto;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .main-image.loaded {
          opacity: 1;
        }
        
        .main-image.hidden {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ImageView;