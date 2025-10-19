import React from 'react';

/**
 * Tool Usage View Component
 *
 * Displays information about tools being used by the agent
 * Shows which tools are currently active and their status
 */
const ToolUsageView = ({
  content,
  isStreaming = false,
  onCopy
}) => {

  return (
    <div
      className="tool-usage-container"
      style={{
        backgroundColor: '#e8f4fd',
        border: '1px solid #b3d9ff',
        borderRadius: '8px',
        padding: '12px 16px',
        margin: '8px 0',
        fontSize: '14px',
        color: '#0066cc',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'relative'
      }}
    >
      {/* Tool icon */}
      <div
        className="tool-icon"
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: '#0066cc',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          flexShrink: 0
        }}
      >
        🛠️
      </div>

      {/* Tool usage text */}
      <div
        className="tool-text"
        style={{
          flex: 1,
          fontWeight: '500'
        }}
      >
        {isStreaming && (
          <span
            className="streaming-indicator"
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              backgroundColor: '#28a745',
              borderRadius: '50%',
              marginRight: '8px',
              animation: 'pulse 2s infinite'
            }}
          />
        )}
        {content}
      </div>

      {/* Copy button */}
      {onCopy && (
        <button
          onClick={() => onCopy(content, 'TOOL_USAGE')}
          style={{
            background: 'none',
            border: 'none',
            color: '#0066cc',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            fontSize: '12px',
            opacity: 0.7
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          title="Copy tool usage info"
        >
          📋
        </button>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .tool-usage-container:hover {
          background-color: #d1e7ff;
          border-color: #80bfff;
        }
      `}</style>
    </div>
  );
};

export default ToolUsageView;