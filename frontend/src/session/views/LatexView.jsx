import React, { useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * LaTeX View Component
 * Renders LaTeX math expressions using KaTeX
 */
const LatexView = ({ content, isStreaming, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState(null);

  const handleCopy = () => {
    if (onCopy) {
      onCopy(content);
    } else {
      navigator.clipboard.writeText(content);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMath = () => {
    try {
      setRenderError(null);
      
      // Check if it's inline or block math
      const isBlock = content.includes('\\begin{') || 
                     content.includes('\\\\') || 
                     content.includes('\\align') ||
                     content.length > 50;

      if (isBlock) {
        return <BlockMath math={content} />;
      } else {
        return <InlineMath math={content} />;
      }
    } catch (error) {
      setRenderError(error.message);
      return (
        <div className="math-error">
          <div className="error-message">Math Rendering Error:</div>
          <div className="error-details">{error.message}</div>
          <div className="raw-latex">
            <strong>Raw LaTeX:</strong>
            <pre>{content}</pre>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="latex-view">
      <div className="latex-header">
        <span className="format-tag">LaTeX</span>
        <div className="latex-actions">
          {renderError && (
            <span className="error-indicator" title={renderError}>⚠️</span>
          )}
          {!isStreaming && (
            <button 
              className="copy-button"
              onClick={handleCopy}
              title="Copy LaTeX code"
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          )}
        </div>
      </div>
      
      <div className="latex-content">
        {isStreaming ? (
          <div className="streaming-latex">
            <div className="preview-section">
              <div className="section-title">Preview:</div>
              {renderMath()}
            </div>
            <div className="source-section">
              <div className="section-title">Source:</div>
              <pre className="latex-source">{content}<span className="streaming-cursor">▌</span></pre>
            </div>
          </div>
        ) : (
          <div className="rendered-latex">
            <div className="preview-section">
              <div className="section-title">Preview:</div>
              <div className="math-container">
                {renderMath()}
              </div>
            </div>
            <div className="source-section">
              <div className="section-title">Source:</div>
              <pre className="latex-source">{content}</pre>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .latex-view {
          background: #fefefe;
          border-radius: 8px;
          overflow: hidden;
          margin: 8px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
        }
        
        .latex-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f0f7ff;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .format-tag {
          color: #1e40af;
          font-size: 12px;
          font-weight: 600;
        }
        
        .latex-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .error-indicator {
          font-size: 14px;
        }
        
        .copy-button {
          background: #dbeafe;
          color: #1e40af;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .copy-button:hover {
          background: #bfdbfe;
          color: #1d4ed8;
        }
        
        .latex-content {
          padding: 16px;
        }
        
        .streaming-latex, .rendered-latex {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .preview-section {
          background: #f9fafb;
          border-radius: 6px;
          padding: 12px;
          border: 1px solid #e5e7eb;
        }
        
        .source-section {
          background: #1f2937;
          border-radius: 6px;
          padding: 12px;
          color: #f9fafb;
        }
        
        .section-title {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #6b7280;
          text-transform: uppercase;
        }
        
        .source-section .section-title {
          color: #9ca3af;
        }
        
        .math-container {
          text-align: center;
          padding: 8px;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .latex-source {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
          white-space: pre-wrap;
          margin: 0;
          word-wrap: break-word;
        }
        
        .streaming-cursor {
          color: #3b82f6;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .math-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          padding: 12px;
          color: #dc2626;
        }
        
        .error-message {
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .error-details {
          font-size: 13px;
          margin-bottom: 8px;
          color: #7f1d1d;
        }
        
        .raw-latex {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #fecaca;
        }
        
        .raw-latex strong {
          display: block;
          margin-bottom: 4px;
        }
        
        .raw-latex pre {
          background: #f7f7f7;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
          margin: 0;
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default LatexView;