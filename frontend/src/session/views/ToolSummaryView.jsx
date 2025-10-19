import React from 'react';

/**
 * Tool Summary View Component
 *
 * Displays summary information about tools that were used to complete a request
 * Shows completion status and performance metrics
 */
const ToolSummaryView = ({
  content,
  onCopy
}) => {
  return (
    <div
      className="tool-summary-container"
      style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #b3e5fc',
        borderRadius: '8px',
        padding: '12px 16px',
        margin: '8px 0',
        fontSize: '14px',
        color: '#0277bd',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'relative'
      }}
    >
      {/* Checkmark icon */}
      <div
        className="summary-icon"
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: '#4caf50',
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
        ✓
      </div>

      {/* Summary text */}
      <div
        className="summary-text"
        style={{
          flex: 1,
          fontWeight: '500'
        }}
      >
        {content}
      </div>

      {/* Copy button */}
      {onCopy && (
        <button
          onClick={() => onCopy(content, 'TOOL_SUMMARY')}
          style={{
            background: 'none',
            border: 'none',
            color: '#0277bd',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            fontSize: '12px',
            opacity: 0.7
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          title="Copy tool summary"
        >
          📋
        </button>
      )}

      {/* CSS for hover effects */}
      <style jsx>{`
        .tool-summary-container:hover {
          background-color: #e1f5fe;
          border-color: #81d4fa;
        }
      `}</style>
    </div>
  );
};

export default ToolSummaryView;