import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Code View Component
 * Renders code with syntax highlighting and copy functionality
 */
const CodeView = ({ content, language = 'javascript', isStreaming, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = content;
    if (onCopy) {
      onCopy(textToCopy);
    } else {
      navigator.clipboard.writeText(textToCopy);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-detect language from content if not specified
  const detectLanguage = (code) => {
    if (language && language !== 'javascript') return language;
    
    // Simple language detection based on patterns
    if (code.includes('def ') || code.includes('import ') || code.includes('print(')) return 'python';
    if (code.includes('function ') || code.includes('const ') || code.includes('=>')) return 'javascript';
    if (code.includes('class ') && code.includes('public ')) return 'java';
    if (code.includes('#include') || code.includes('int main')) return 'cpp';
    if (code.includes('SELECT ') || code.includes('FROM ')) return 'sql';
    if (code.includes('<html') || code.includes('<div')) return 'html';
    if (code.includes('.class') || code.includes('display:')) return 'css';
    if (code.includes('{') && code.includes('"')) return 'json';
    
    return 'text';
  };

  const detectedLang = detectLanguage(content);

  return (
    <div className="code-view">
      <div className="code-header">
        <span className="language-tag">{detectedLang}</span>
        {!isStreaming && (
          <button 
            className="copy-button"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        )}
      </div>
      
      <div className="code-content">
        {isStreaming ? (
          <div className="streaming-code">
            <SyntaxHighlighter
              language={detectedLang}
              style={oneDark}
              customStyle={{
                margin: 0,
                background: 'transparent',
                fontSize: '14px',
                lineHeight: '1.4'
              }}
              wrapLines={true}
              wrapLongLines={true}
            >
              {content}
            </SyntaxHighlighter>
            <span className="streaming-cursor">▌</span>
          </div>
        ) : (
          <SyntaxHighlighter
            language={detectedLang}
            style={oneDark}
            customStyle={{
              margin: 0,
              background: 'transparent',
              fontSize: '14px',
              lineHeight: '1.4'
            }}
            wrapLines={true}
            wrapLongLines={true}
          >
            {content}
          </SyntaxHighlighter>
        )}
      </div>
      
      <style jsx>{`
        .code-view {
          background: #2d3748;
          border-radius: 8px;
          overflow: hidden;
          margin: 8px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .language-tag {
          color: #a0aec0;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .copy-button {
          background: rgba(255,255,255,0.1);
          color: #e2e8f0;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .copy-button:hover {
          background: rgba(255,255,255,0.2);
          color: white;
        }
        
        .code-content {
          position: relative;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .streaming-code {
          position: relative;
        }
        
        .streaming-cursor {
          color: #4fd1c7;
          animation: blink 1s infinite;
          margin-left: 2px;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CodeView;