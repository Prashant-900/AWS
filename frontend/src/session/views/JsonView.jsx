import React, { useState } from 'react';

/**
 * JSON View Component
 * Renders JSON with formatting, collapsible sections, and copy functionality
 */
const JsonView = ({ content, isStreaming, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState({});

  let parsedJson;
  let isValidJson = false;
  let formattedJson = '';

  try {
    // Try to parse the JSON
    parsedJson = JSON.parse(content);
    isValidJson = true;
    formattedJson = JSON.stringify(parsedJson, null, 2);
  } catch {
    // If parsing fails, treat as raw text
    parsedJson = content;
    formattedJson = content;
  }

  const handleCopy = () => {
    const textToCopy = isValidJson ? formattedJson : content;
    if (onCopy) {
      onCopy(textToCopy);
    } else {
      navigator.clipboard.writeText(textToCopy);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = (path) => {
    setExpanded(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const renderJsonValue = (value, key, path = '', level = 0) => {
    const currentPath = path ? `${path}.${key}` : key;
    const isExpanded = expanded[currentPath] !== false; // Default to expanded

    if (value === null) {
      return <span className="json-null">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="json-boolean">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="json-number">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="json-string">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="json-bracket">[]</span>;
      }

      return (
        <div className="json-array">
          <span 
            className="json-bracket clickable"
            onClick={() => toggleExpand(currentPath)}
          >
            [{isExpanded ? '' : `...${value.length} items`}
          </span>
          {isExpanded && (
            <div className="json-array-content" style={{ marginLeft: `${level * 20 + 20}px` }}>
              {value.map((item, index) => (
                <div key={index} className="json-array-item">
                  <span className="json-index">{index}:</span>
                  {renderJsonValue(item, index, currentPath, level + 1)}
                  {index < value.length - 1 && <span className="json-comma">,</span>}
                </div>
              ))}
            </div>
          )}
          <span className="json-bracket">]</span>
        </div>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="json-brace">{}</span>;
      }

      return (
        <div className="json-object">
          <span 
            className="json-brace clickable"
            onClick={() => toggleExpand(currentPath)}
          >
            {'{'}
            {isExpanded ? '' : `...${keys.length} keys`}
          </span>
          {isExpanded && (
            <div className="json-object-content" style={{ marginLeft: `${level * 20 + 20}px` }}>
              {keys.map((objKey, index) => (
                <div key={objKey} className="json-object-item">
                  <span className="json-key">"{objKey}":</span>
                  {renderJsonValue(value[objKey], objKey, currentPath, level + 1)}
                  {index < keys.length - 1 && <span className="json-comma">,</span>}
                </div>
              ))}
            </div>
          )}
          <span className="json-brace">{'}'}</span>
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div className="json-view">
      <div className="json-header">
        <span className="format-tag">JSON</span>
        <div className="json-actions">
          {isValidJson && (
            <button 
              className="expand-button"
              onClick={() => {
                const allPaths = [];
                JSON.stringify(parsedJson, (key, value) => {
                  if (typeof value === 'object' && value !== null) {
                    allPaths.push(key);
                  }
                  return value;
                });
                
                const allExpanded = allPaths.every(path => expanded[path] !== false);
                const newExpanded = {};
                allPaths.forEach(path => {
                  newExpanded[path] = !allExpanded;
                });
                setExpanded(newExpanded);
              }}
              title="Expand/Collapse all"
            >
              {Object.values(expanded).every(v => v !== false) ? '📁' : '📂'}
            </button>
          )}
          {!isStreaming && (
            <button 
              className="copy-button"
              onClick={handleCopy}
              title="Copy JSON"
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          )}
        </div>
      </div>
      
      <div className="json-content">
        {isStreaming ? (
          <div className="streaming-json">
            <pre>{content}</pre>
            <span className="streaming-cursor">▌</span>
          </div>
        ) : (
          <div className="json-formatted">
            {isValidJson ? (
              renderJsonValue(parsedJson, '', '', 0)
            ) : (
              <pre className="json-raw">{content}</pre>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .json-view {
          background: #1e1e1e;
          border-radius: 8px;
          overflow: hidden;
          margin: 8px 0;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .json-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .format-tag {
          color: #61dafb;
          font-size: 12px;
          font-weight: 600;
        }
        
        .json-actions {
          display: flex;
          gap: 4px;
        }
        
        .expand-button, .copy-button {
          background: rgba(255,255,255,0.1);
          color: #e2e8f0;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .expand-button:hover, .copy-button:hover {
          background: rgba(255,255,255,0.2);
          color: white;
        }
        
        .json-content {
          padding: 12px;
          max-height: 500px;
          overflow-y: auto;
          background: #1e1e1e;
        }
        
        .json-formatted {
          color: #d4d4d4;
          font-size: 13px;
          line-height: 1.4;
        }
        
        .json-string { color: #ce9178; }
        .json-number { color: #b5cea8; }
        .json-boolean { color: #569cd6; }
        .json-null { color: #569cd6; }
        .json-key { color: #9cdcfe; }
        .json-bracket, .json-brace { color: #d4d4d4; }
        .json-comma { color: #d4d4d4; }
        .json-index { color: #9cdcfe; margin-right: 8px; }
        
        .clickable {
          cursor: pointer;
          user-select: none;
        }
        
        .clickable:hover {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }
        
        .json-array-item, .json-object-item {
          margin: 2px 0;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        
        .streaming-json {
          position: relative;
          color: #d4d4d4;
        }
        
        .streaming-cursor {
          color: #61dafb;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .json-raw {
          color: #d4d4d4;
          margin: 0;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

export default JsonView;