import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';

/**
 * Mermaid View Component
 * Renders Mermaid diagrams with edit capability and dual view mode
 */
const MermaidView = ({ content, isStreaming, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('render');
  const [editableContent, setEditableContent] = useState(content);
  const [renderError, setRenderError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const mermaidRef = useRef(null);
  const mermaidId = useRef(`mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Initialize mermaid once on mount
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false, // We'll manually trigger rendering
      theme: 'default',
      themeVariables: {
        primaryColor: '#4f46e5',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#e5e7eb',
        lineColor: '#6b7280',
        sectionBkgColor: '#f9fafb',
        altSectionBkgColor: '#ffffff',
        gridColor: '#e5e7eb'
      }
    });
  }, []);

  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  const renderMermaid = React.useCallback(async (mermaidCode) => {
    if (!mermaidCode.trim() || isStreaming) return;

    try {
      setRenderError(null);
      
      // Validate and render
      const isValid = await mermaid.parse(mermaidCode);
      if (isValid) {
        const { svg } = await mermaid.render(mermaidId.current, mermaidCode);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      }
    } catch (error) {
      setRenderError(error.message || 'Failed to render diagram');
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = `
          <div class="mermaid-error">
            <div class="error-icon">⚠️</div>
            <div class="error-title">Diagram Rendering Error</div>
            <div class="error-message">${error.message || 'Invalid diagram syntax'}</div>
          </div>
        `;
      }
    }
  }, [isStreaming]);

  // Render mermaid diagram when content changes or tab switches to render
  useEffect(() => {
    if (!isStreaming && activeTab === 'render' && editableContent.trim()) {
      // Small delay to ensure DOM is ready and mermaid is initialized
      const timer = setTimeout(() => {
        renderMermaid(editableContent);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [editableContent, activeTab, isStreaming, renderMermaid]);

  const handleCopy = () => {
    const textToCopy = isEditing ? editableContent : content;
    if (onCopy) {
      onCopy(textToCopy);
    } else {
      navigator.clipboard.writeText(textToCopy);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setIsEditing(false);
    renderMermaid(editableContent);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setActiveTab('code');
  };

  const downloadSvg = () => {
    const svgElement = mermaidRef.current?.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mermaid-diagram.svg';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="mermaid-view">
      <div className="mermaid-header">
        <div className="header-left">
          <span className="format-tag">MERMAID</span>
          {renderError && (
            <span className="error-indicator" title={renderError}>⚠️</span>
          )}
        </div>
        
        <div className="header-actions">
          {!isStreaming && (
            <>
              <div className="tab-buttons">
                <button 
                  className={`tab-button ${activeTab === 'render' ? 'active' : ''}`}
                  onClick={() => setActiveTab('render')}
                >
                  📊 Render
                </button>
                <button 
                  className={`tab-button ${activeTab === 'code' ? 'active' : ''}`}
                  onClick={() => setActiveTab('code')}
                >
                  📝 Code
                </button>
              </div>
              
              {activeTab === 'render' && !renderError && (
                <button 
                  className="action-button"
                  onClick={downloadSvg}
                  title="Download as SVG"
                >
                  💾
                </button>
              )}
              
              {activeTab === 'code' && (
                <button 
                  className="action-button"
                  onClick={isEditing ? handleSave : handleEdit}
                  title={isEditing ? 'Save changes' : 'Edit diagram'}
                >
                  {isEditing ? '💾' : '✏️'}
                </button>
              )}
              
              <button 
                className="copy-button"
                onClick={handleCopy}
                title="Copy mermaid code"
              >
                {copied ? '✅' : '📋'}
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="mermaid-content">
        {isStreaming ? (
          <div className="streaming-mermaid">
            <div className="streaming-info">
              <span>Streaming diagram code...</span>
            </div>
            <pre className="mermaid-code-preview">
              {content}
              <span className="streaming-cursor">▌</span>
            </pre>
          </div>
        ) : (
          <>
            {activeTab === 'render' ? (
              <div className="render-tab">
                <div 
                  ref={mermaidRef} 
                  className="mermaid-container"
                  style={{
                    textAlign: 'center',
                    padding: '20px',
                    minHeight: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fafafa'
                  }}
                />
              </div>
            ) : (
              <div className="code-tab">
                {isEditing ? (
                  <textarea
                    className="mermaid-editor"
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    placeholder="Enter mermaid diagram code..."
                    rows={Math.max(10, editableContent.split('\n').length + 2)}
                  />
                ) : (
                  <pre className="mermaid-code">{editableContent}</pre>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      <style jsx>{`
        .mermaid-view {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          margin: 8px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
        }
        
        .mermaid-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f0fdf4;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .format-tag {
          color: #16a34a;
          font-size: 12px;
          font-weight: 600;
        }
        
        .error-indicator {
          font-size: 14px;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .tab-buttons {
          display: flex;
          background: #e5e7eb;
          border-radius: 4px;
          padding: 2px;
        }
        
        .tab-button {
          background: transparent;
          border: none;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.2s ease;
          color: #6b7280;
        }
        
        .tab-button.active {
          background: white;
          color: #16a34a;
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .tab-button:hover:not(.active) {
          color: #374151;
        }
        
        .action-button, .copy-button {
          background: #dcfce7;
          color: #16a34a;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-button:hover, .copy-button:hover {
          background: #bbf7d0;
          color: #15803d;
        }
        
        .mermaid-content {
          min-height: 200px;
        }
        
        .streaming-mermaid {
          padding: 16px;
        }
        
        .streaming-info {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 12px;
          font-style: italic;
        }
        
        .mermaid-code-preview {
          background: #1f2937;
          color: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
          white-space: pre-wrap;
          margin: 0;
        }
        
        .streaming-cursor {
          color: #16a34a;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .render-tab {
          background: #fafafa;
        }
        
        .code-tab {
          padding: 0;
        }
        
        .mermaid-editor {
          width: 100%;
          border: none;
          padding: 16px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
          background: #1f2937;
          color: #f9fafb;
          resize: vertical;
          min-height: 200px;
        }
        
        .mermaid-editor:focus {
          outline: none;
          background: #111827;
        }
        
        .mermaid-code {
          background: #1f2937;
          color: #f9fafb;
          padding: 16px;
          margin: 0;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
          white-space: pre-wrap;
          min-height: 200px;
        }
      `}</style>
      
      <style jsx global>{`
        .mermaid-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: 20px;
          color: #dc2626;
        }
        
        .mermaid-error .error-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        
        .mermaid-error .error-title {
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .mermaid-error .error-message {
          font-size: 14px;
          color: #7f1d1d;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default MermaidView;