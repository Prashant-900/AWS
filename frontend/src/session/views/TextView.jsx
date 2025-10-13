import React from 'react';

/**
 * Text View Component
 * Renders normal text content in a chat bubble style
 */
const TextView = ({ content, isStreaming, onCopy }) => {
  const handleCopy = () => {
    if (onCopy) {
      onCopy(content);
    } else {
      navigator.clipboard.writeText(content);
    }
  };

  return (
    <div className="text-view">
      <div className="text-content">
        {content}
        {isStreaming && (
          <span className="streaming-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </span>
        )}
      </div>
      
      {!isStreaming && content.trim() && (
        <div className="view-actions">
          <button 
            className="copy-button"
            onClick={handleCopy}
            title="Copy text"
          >
            📋 Copy
          </button>
        </div>
      )}
      
      <style jsx>{`
        .text-view {
          position: relative;
          padding: 0;
        }
        
        .text-content {
          white-space: pre-wrap;
          word-wrap: break-word;
          line-height: 1.5;
        }
        
        .streaming-indicator {
          display: inline-flex;
          margin-left: 4px;
        }
        
        .dot {
          width: 4px;
          height: 4px;
          background: currentColor;
          border-radius: 50%;
          margin: 0 1px;
          opacity: 0.4;
          animation: pulse 1.4s infinite ease-in-out;
        }
        
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        .dot:nth-child(3) { animation-delay: 0s; }
        
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.4; }
          40% { opacity: 1; }
        }
        
        .view-actions {
          position: absolute;
          top: -8px;
          right: -8px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .text-view:hover .view-actions {
          opacity: 1;
        }
        
        .copy-button {
          background: rgba(0,0,0,0.7);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .copy-button:hover {
          background: rgba(0,0,0,0.9);
        }
      `}</style>
    </div>
  );
};

export default TextView;