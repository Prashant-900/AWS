import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';

/**
 * CSV View Component
 * Renders CSV data as a formatted table with sorting and copy functionality
 */
const CsvView = ({ content, isStreaming, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [showRawData, setShowRawData] = useState(false);

  const csvData = useMemo(() => {
    if (!content || !content.trim()) {
      return { headers: [], rows: [], error: null };
    }

    try {
      const result = Papa.parse(content.trim(), {
        header: false,
        skipEmptyLines: true,
        dynamicTyping: true
      });

      if (result.errors.length > 0 && result.data.length === 0) {
        return { 
          headers: [], 
          rows: [], 
          error: result.errors[0].message 
        };
      }

      const data = result.data.filter(row => 
        row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
      );

      if (data.length === 0) {
        return { headers: [], rows: [], error: 'No valid data found' };
      }

      // First row as headers
      const headers = data[0].map((header, index) => 
        header?.toString() || `Column ${index + 1}`
      );
      
      const rows = data.slice(1);

      return { headers, rows, error: null };
    } catch (error) {
      return { 
        headers: [], 
        rows: [], 
        error: error.message || 'Failed to parse CSV' 
      };
    }
  }, [content]);

  const sortedRows = useMemo(() => {
    if (!sortColumn || !csvData.rows.length) return csvData.rows;

    const columnIndex = csvData.headers.indexOf(sortColumn);
    if (columnIndex === -1) return csvData.rows;

    return [...csvData.rows].sort((a, b) => {
      const aVal = a[columnIndex];
      const bVal = b[columnIndex];
      
      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      // Convert to string for comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      // Try numeric comparison first
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // String comparison
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [csvData.rows, csvData.headers, sortColumn, sortDirection]);

  const handleSort = (header) => {
    if (sortColumn === header) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(header);
      setSortDirection('asc');
    }
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(content);
    } else {
      navigator.clipboard.writeText(content);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSortIcon = (header) => {
    if (sortColumn !== header) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="csv-view">
      <div className="csv-header">
        <div className="header-left">
          <span className="format-tag">CSV</span>
          {csvData.error && (
            <span className="error-indicator" title={csvData.error}>⚠️</span>
          )}
          {csvData.rows.length > 0 && (
            <span className="data-info">
              {csvData.headers.length} cols × {csvData.rows.length} rows
            </span>
          )}
        </div>
        
        <div className="header-actions">
          {!isStreaming && csvData.rows.length > 0 && (
            <button 
              className="view-toggle"
              onClick={() => setShowRawData(!showRawData)}
              title={showRawData ? 'Show table view' : 'Show raw data'}
            >
              {showRawData ? '📊' : '📝'}
            </button>
          )}
          {!isStreaming && (
            <button 
              className="copy-button"
              onClick={handleCopy}
              title="Copy CSV data"
            >
              {copied ? '✅' : '📋'}
            </button>
          )}
        </div>
      </div>
      
      <div className="csv-content">
        {isStreaming ? (
          <div className="streaming-csv">
            <div className="streaming-info">
              <span>Streaming CSV data...</span>
            </div>
            <pre className="csv-preview">
              {content}
              <span className="streaming-cursor">▌</span>
            </pre>
          </div>
        ) : csvData.error ? (
          <div className="csv-error">
            <div className="error-icon">📋⚠️</div>
            <div className="error-title">CSV Parse Error</div>
            <div className="error-message">{csvData.error}</div>
            <div className="raw-data">
              <strong>Raw Data:</strong>
              <pre>{content}</pre>
            </div>
          </div>
        ) : csvData.rows.length === 0 ? (
          <div className="empty-csv">
            <div className="empty-icon">📋</div>
            <div className="empty-message">No CSV data to display</div>
          </div>
        ) : showRawData ? (
          <div className="raw-view">
            <pre className="csv-raw">{content}</pre>
          </div>
        ) : (
          <div className="table-view">
            <div className="table-container">
              <table className="csv-table">
                <thead>
                  <tr>
                    {csvData.headers.map((header, index) => (
                      <th 
                        key={index}
                        onClick={() => handleSort(header)}
                        className="sortable-header"
                        title={`Sort by ${header}`}
                      >
                        <div className="header-content">
                          <span className="header-text">{header}</span>
                          <span className="sort-icon">{getSortIcon(header)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {csvData.headers.map((_, colIndex) => (
                        <td key={colIndex}>
                          {row[colIndex] != null ? String(row[colIndex]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .csv-view {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          margin: 8px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
        }
        
        .csv-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f0f9ff;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .format-tag {
          color: #0284c7;
          font-size: 12px;
          font-weight: 600;
        }
        
        .error-indicator {
          font-size: 14px;
        }
        
        .data-info {
          font-size: 11px;
          color: #64748b;
          background: rgba(2, 132, 199, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .view-toggle, .copy-button {
          background: #e0f2fe;
          color: #0284c7;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .view-toggle:hover, .copy-button:hover {
          background: #bae6fd;
          color: #0369a1;
        }
        
        .csv-content {
          max-height: 500px;
          overflow: auto;
        }
        
        .streaming-csv {
          padding: 16px;
        }
        
        .streaming-info {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 12px;
          font-style: italic;
        }
        
        .csv-preview {
          background: #1e293b;
          color: #f1f5f9;
          padding: 16px;
          border-radius: 6px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
          white-space: pre;
          margin: 0;
          overflow-x: auto;
        }
        
        .streaming-cursor {
          color: #0284c7;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .csv-error, .empty-csv {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: 20px;
          text-align: center;
        }
        
        .csv-error {
          color: #dc2626;
          background: #fef2f2;
        }
        
        .empty-csv {
          color: #64748b;
          background: #f8fafc;
        }
        
        .error-icon, .empty-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        
        .error-title, .empty-message {
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .error-message {
          font-size: 14px;
          color: #7f1d1d;
          margin-bottom: 16px;
        }
        
        .raw-data {
          text-align: left;
          width: 100%;
          max-width: 500px;
        }
        
        .raw-data pre {
          background: #f7f7f7;
          padding: 12px;
          border-radius: 4px;
          font-size: 12px;
          margin: 8px 0 0 0;
          color: #374151;
          overflow: auto;
          max-height: 150px;
        }
        
        .raw-view {
          padding: 16px;
        }
        
        .csv-raw {
          background: #1e293b;
          color: #f1f5f9;
          padding: 16px;
          border-radius: 6px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
          white-space: pre;
          margin: 0;
          overflow: auto;
        }
        
        .table-view {
          padding: 0;
        }
        
        .table-container {
          overflow: auto;
          max-height: 500px;
        }
        
        .csv-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .csv-table th {
          background: #f8fafc;
          padding: 12px 8px;
          text-align: left;
          border-bottom: 2px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        
        .sortable-header {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease;
        }
        
        .sortable-header:hover {
          background: #f1f5f9 !important;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        
        .header-text {
          font-weight: 600;
          color: #1e293b;
        }
        
        .sort-icon {
          font-size: 12px;
          color: #64748b;
        }
        
        .csv-table td {
          padding: 8px;
          border-bottom: 1px solid #f1f5f9;
          word-wrap: break-word;
          max-width: 200px;
        }
        
        .csv-table tr:hover {
          background: #f8fafc;
        }
        
        .csv-table tr:nth-child(even) {
          background: #fafbfc;
        }
        
        .csv-table tr:nth-child(even):hover {
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
};

export default CsvView;