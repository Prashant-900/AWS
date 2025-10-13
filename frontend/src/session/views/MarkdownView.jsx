import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Markdown View Component
 * Renders markdown content with syntax highlighting for code blocks
 */
const MarkdownView = ({ content, isStreaming, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy(content);
    } else {
      navigator.clipboard.writeText(content);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const components = {
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      
      return !inline ? (
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          customStyle={{
            borderRadius: '4px',
            fontSize: '14px',
            lineHeight: '1.4'
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="inline-code" {...props}>
          {children}
        </code>
      );
    },
    
    // Custom heading renderer with anchor links
    h1: ({ children }) => (
      <h1 className="markdown-h1">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="markdown-h2">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="markdown-h3">{children}</h3>
    ),
    
    // Custom link renderer with external link handling
    a: ({ href, children }) => (
      <a 
        href={href} 
        className="markdown-link"
        target={href && href.startsWith('http') ? '_blank' : undefined}
        rel={href && href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    
    // Custom table renderer
    table: ({ children }) => (
      <div className="table-wrapper">
        <table className="markdown-table">{children}</table>
      </div>
    ),
    
    // Custom blockquote renderer
    blockquote: ({ children }) => (
      <blockquote className="markdown-blockquote">{children}</blockquote>
    ),
    
    // Custom list renderer
    ul: ({ children }) => (
      <ul className="markdown-ul">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="markdown-ol">{children}</ol>
    ),
  };

  return (
    <div className="markdown-view">
      <div className="markdown-header">
        <span className="format-tag">MARKDOWN</span>
        {!isStreaming && (
          <button 
            className="copy-button"
            onClick={handleCopy}
            title="Copy markdown"
          >
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        )}
      </div>
      
      <div className="markdown-content">
        {isStreaming ? (
          <div className="streaming-markdown">
            <ReactMarkdown components={components}>
              {content}
            </ReactMarkdown>
            <span className="streaming-cursor">▌</span>
          </div>
        ) : (
          <ReactMarkdown components={components}>
            {content}
          </ReactMarkdown>
        )}
      </div>
      
      <style jsx>{`
        .markdown-view {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          margin: 8px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
        }
        
        .markdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f7fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .format-tag {
          color: #2d3748;
          font-size: 12px;
          font-weight: 600;
        }
        
        .copy-button {
          background: #e2e8f0;
          color: #2d3748;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .copy-button:hover {
          background: #cbd5e0;
          color: #1a202c;
        }
        
        .markdown-content {
          padding: 16px;
          max-height: 600px;
          overflow-y: auto;
        }
        
        .streaming-markdown {
          position: relative;
        }
        
        .streaming-cursor {
          color: #4299e1;
          animation: blink 1s infinite;
          margin-left: 2px;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
      
      <style jsx global>{`
        .markdown-view .markdown-h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 1rem;
          color: #1a202c;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }
        
        .markdown-view .markdown-h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #2d3748;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.25rem;
        }
        
        .markdown-view .markdown-h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: #2d3748;
        }
        
        .markdown-view .inline-code {
          background: #f7fafc;
          color: #e53e3e;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }
        
        .markdown-view .markdown-link {
          color: #3182ce;
          text-decoration: underline;
          transition: color 0.2s ease;
        }
        
        .markdown-view .markdown-link:hover {
          color: #2c5282;
        }
        
        .markdown-view .table-wrapper {
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        .markdown-view .markdown-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e2e8f0;
        }
        
        .markdown-view .markdown-table th,
        .markdown-view .markdown-table td {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          text-align: left;
        }
        
        .markdown-view .markdown-table th {
          background: #f7fafc;
          font-weight: 600;
          color: #2d3748;
        }
        
        .markdown-view .markdown-blockquote {
          border-left: 4px solid #4299e1;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #4a5568;
          background: #f7fafc;
          border-radius: 0 4px 4px 0;
          padding: 1rem;
        }
        
        .markdown-view .markdown-ul,
        .markdown-view .markdown-ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        
        .markdown-view .markdown-ul li,
        .markdown-view .markdown-ol li {
          margin-bottom: 0.25rem;
        }
        
        .markdown-view p {
          margin: 1rem 0;
          line-height: 1.6;
        }
        
        .markdown-view p:first-child {
          margin-top: 0;
        }
        
        .markdown-view p:last-child {
          margin-bottom: 0;
        }
        
        .markdown-view strong {
          font-weight: 600;
        }
        
        .markdown-view em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default MarkdownView;