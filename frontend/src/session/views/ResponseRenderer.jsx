import React, { useState, useEffect, useMemo } from 'react';
import { formatParser } from './formatParser';
import { getConfig } from '../../config';

// Import all view components
import TextView from './TextView';
import CodeView from './CodeView';
import JsonView from './JsonView';
import MarkdownView from './MarkdownView';
import LatexView from './LatexView';
import MermaidView from './MermaidView';
import CsvView from './CsvView';
import ImageView from './ImageView';
import TableView from './TableView';
import ToolUsageView from './ToolUsageView';
import ToolSummaryView from './ToolSummaryView';

/**
 * Main Response Renderer Component
 * 
 * Renders AI responses with multiple formats in a single response
 * Supports live streaming and proper format detection
 */
const ResponseRenderer = ({ 
  content, 
  isStreaming = false, 
  messageId,
  onCopy 
}) => {
  const [streamBuffer, setStreamBuffer] = useState('');
  const [finalBlocks, setFinalBlocks] = useState([]);

  // Handle streaming content updates
  useEffect(() => {
    if (isStreaming) {
      setStreamBuffer(content || '');
    } else {
      // Final content received, parse into blocks
      if (content) {
        const blocks = formatParser.parseResponse(content);
        setFinalBlocks(blocks);
        setStreamBuffer(''); // Clear stream buffer
      }
    }
  }, [content, isStreaming]);

  // Parse streaming content for live updates
  const streamingBlocks = useMemo(() => {
    if (!isStreaming || !streamBuffer) return [];
    
    const streamResult = formatParser.parseStreaming(streamBuffer);
    return streamResult.blocks;
  }, [streamBuffer, isStreaming]);

  // Get blocks to render
  const blocksToRender = isStreaming ? streamingBlocks : finalBlocks;

  // Component mapping for different format types
  const getViewComponent = (block) => {
    const { type, content: blockContent, id, isStreaming: blockStreaming } = block;
    const props = {
      content: blockContent,
      isStreaming: blockStreaming,
      onCopy: onCopy ? (text) => onCopy(text, type) : undefined,
      key: `${messageId}-${id}`
    };

    switch (type) {
      case 'TEXT':
        return <TextView {...props} />;
      
      case 'CODE':
        return <CodeView {...props} />;
      
      case 'JSON':
        return <JsonView {...props} />;
      
      case 'MARKDOWN':
        return <MarkdownView {...props} />;
      
      case 'LATEX':
        return <LatexView {...props} />;
      
      case 'MERMAID':
        return <MermaidView {...props} />;
      
      case 'CSV':
        return <CsvView {...props} />;
      
      case 'IMAGE':
        return <ImageView {...props} />;
      
      case 'TABLE':
        return <TableView {...props} />;
      
      case 'TOOL_USAGE':
        return <ToolUsageView {...props} />;
      
      case 'TOOL_SUMMARY':
        return <ToolSummaryView {...props} />;
      
      default:
        // Unknown format, render as text with warning
        return (
          <div key={`${messageId}-${id}`} className="unknown-format">
            <div className="warning-header">
              <span className="warning-icon">⚠️</span>
              <span className="warning-text">Unknown format: {type}</span>
            </div>
            <TextView {...props} />
          </div>
        );
    }
  };

  // Handle copy functionality
  const handleBlockCopy = (text, formatType) => {
    if (onCopy) {
      onCopy(text, formatType);
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  // Show loading state for empty content
  if (!content && !isStreaming) {
    return null;
  }

  // Show streaming indicator for empty stream
  if (isStreaming && !streamBuffer) {
    return (
      <div className="response-renderer">
        <div className="stream-loading">
          <span className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </span>
          <span className="loading-text">AI is thinking...</span>
        </div>
        
        <style jsx>{`
          .response-renderer {
            width: 100%;
          }
          
          .stream-loading {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 0;
            color: #6b7280;
            font-style: italic;
          }
          
          .loading-dots {
            display: flex;
            gap: 2px;
          }
          
          .dot {
            width: 4px;
            height: 4px;
            background: currentColor;
            border-radius: 50%;
            animation: pulse 1.4s infinite ease-in-out;
          }
          
          .dot:nth-child(1) { animation-delay: -0.32s; }
          .dot:nth-child(2) { animation-delay: -0.16s; }
          .dot:nth-child(3) { animation-delay: 0s; }
          
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.3; }
            40% { opacity: 1; }
          }
          
          .loading-text {
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="response-renderer">
      {/* Debug info (only in development) */}
      {(() => {
        try {
          const config = getConfig();
          return config.MODE === 'development';
        } catch {
          return false;
        }
      })() && (
        <div className="debug-info">
          <details>
            <summary>Debug Info</summary>
            <div className="debug-details">
              <p><strong>Streaming:</strong> {isStreaming ? 'Yes' : 'No'}</p>
              <p><strong>Blocks:</strong> {blocksToRender.length}</p>
              <p><strong>Content Length:</strong> {content?.length || 0}</p>
              <p><strong>Block Types:</strong> {blocksToRender.map(b => b.type).join(', ')}</p>
            </div>
          </details>
        </div>
      )}

      {/* Render all blocks */}
      <div className="blocks-container">
        {blocksToRender.length > 0 ? (
          blocksToRender.map((block, index) => (
            <div key={`${messageId}-${block.id}-${index}`} className="block-wrapper">
              {getViewComponent(block)}
            </div>
          ))
        ) : (
          // Fallback for content that couldn't be parsed
          <div className="fallback-content">
            <TextView 
              content={content || streamBuffer}
              isStreaming={isStreaming}
              onCopy={handleBlockCopy}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .response-renderer {
          width: 100%;
        }
        
        .debug-info {
          margin-bottom: 8px;
          font-size: 11px;
          color: #6b7280;
        }
        
        .debug-info details {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 4px 8px;
        }
        
        .debug-info summary {
          cursor: pointer;
          font-weight: 600;
        }
        
        .debug-details {
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid #e5e7eb;
        }
        
        .debug-details p {
          margin: 2px 0;
        }
        
        .blocks-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .block-wrapper {
          position: relative;
        }
        
        .fallback-content {
          /* Styling for fallback text content */
        }
        
        .unknown-format {
          border: 1px solid #fbbf24;
          background: #fffbeb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .warning-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #fef3c7;
          border-bottom: 1px solid #f59e0b;
        }
        
        .warning-icon {
          font-size: 14px;
        }
        
        .warning-text {
          font-size: 12px;
          font-weight: 600;
          color: #92400e;
        }
      `}</style>
    </div>
  );
};

export default ResponseRenderer;