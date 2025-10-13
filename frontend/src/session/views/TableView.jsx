import React, { useState, useMemo } from 'react';

/**
 * Table View Component
 * Renders structured table data with sorting and copy functionality
 */
const TableView = ({ content, isStreaming, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const tableData = useMemo(() => {
    if (!content || !content.trim()) {
      return { headers: [], rows: [], error: 'No table data provided' };
    }

    try {
      // Try to parse as JSON first (structured table data)
      const parsed = JSON.parse(content);
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Array of objects - use keys as headers
        if (typeof parsed[0] === 'object' && parsed[0] !== null) {
          const headers = Object.keys(parsed[0]);
          const rows = parsed.map(obj => headers.map(header => obj[header]));
          return { headers, rows, error: null };
        }
        
        // Array of arrays - first row as headers
        if (Array.isArray(parsed[0])) {
          const headers = parsed[0].map((header, index) => 
            header?.toString() || `Column ${index + 1}`
          );
          const rows = parsed.slice(1);
          return { headers, rows, error: null };
        }
      }
      
      // Single object - convert to single row
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const headers = Object.keys(parsed);
        const rows = [Object.values(parsed)];
        return { headers, rows, error: null };
      }
      
      return { headers: [], rows: [], error: 'Invalid table data format' };
      
    } catch {
      // Not JSON, try to parse as pipe-separated or tab-separated table
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return { headers: [], rows: [], error: 'No table data found' };
      }
      
      // Detect separator (priority: |, \t, multiple spaces)
      let separator = '|';
      const firstLine = lines[0];
      
      if (firstLine.includes('|')) {
        separator = '|';
      } else if (firstLine.includes('\t')) {
        separator = '\t';
      } else if (/\s{2,}/.test(firstLine)) {
        separator = /\s{2,}/;
      } else {
        // Fallback: assume single column
        const headers = ['Content'];
        const rows = lines.map(line => [line.trim()]);
        return { headers, rows, error: null };
      }
      
      // Parse table with separator
      const allRows = lines.map(line => {
        if (separator instanceof RegExp) {
          return line.split(separator).map(cell => cell.trim());
        }
        return line.split(separator).map(cell => cell.trim()).filter(cell => cell !== '');
      });
      
      if (allRows.length === 0) {
        return { headers: [], rows: [], error: 'No valid table data found' };
      }
      
      // First row as headers
      const headers = allRows[0].map((header, index) => 
        header || `Column ${index + 1}`
      );
      
      // Ensure all rows have same number of columns
      const maxColumns = Math.max(...allRows.map(row => row.length));
      const normalizedRows = allRows.slice(1).map(row => {
        const normalizedRow = [...row];
        while (normalizedRow.length < maxColumns) {
          normalizedRow.push('');
        }
        return normalizedRow.slice(0, maxColumns);
      });
      
      return { headers: headers.slice(0, maxColumns), rows: normalizedRows, error: null };
    }
  }, [content]);

  const sortedRows = useMemo(() => {
    if (!sortColumn || !tableData.rows.length) return tableData.rows;

    const columnIndex = tableData.headers.indexOf(sortColumn);
    if (columnIndex === -1) return tableData.rows;

    return [...tableData.rows].sort((a, b) => {
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
  }, [tableData.rows, tableData.headers, sortColumn, sortDirection]);

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
    <div className="table-view">
      <div className="table-header">
        <div className="header-left">
          <span className="format-tag">TABLE</span>
          {tableData.error && (
            <span className="error-indicator" title={tableData.error}>⚠️</span>
          )}
          {tableData.rows.length > 0 && (
            <span className="data-info">
              {tableData.headers.length} cols × {tableData.rows.length} rows
            </span>
          )}
        </div>
        
        <div className="header-actions">
          {!isStreaming && (
            <button 
              className="copy-button"
              onClick={handleCopy}
              title="Copy table data"
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          )}
        </div>
      </div>
      
      <div className="table-content">
        {isStreaming ? (
          <div className="streaming-table">
            <div className="streaming-info">
              <span>Streaming table data...</span>
            </div>
            <pre className="table-preview">
              {content}
              <span className="streaming-cursor">▌</span>
            </pre>
          </div>
        ) : tableData.error ? (
          <div className="table-error">
            <div className="error-icon">📊⚠️</div>
            <div className="error-title">Table Parse Error</div>
            <div className="error-message">{tableData.error}</div>
            <div className="format-help">
              <strong>Supported formats:</strong>
              <ul>
                <li>JSON array of objects: <code>[{`{"col1": "val1", "col2": "val2"}`}]</code></li>
                <li>JSON array of arrays: <code>[["header1", "header2"], ["val1", "val2"]]</code></li>
                <li>Pipe-separated: <code>Header1 | Header2\nValue1 | Value2</code></li>
                <li>Tab-separated: <code>Header1	Header2\nValue1	Value2</code></li>
              </ul>
            </div>
            <div className="raw-data">
              <strong>Raw Data:</strong>
              <pre>{content}</pre>
            </div>
          </div>
        ) : tableData.rows.length === 0 ? (
          <div className="empty-table">
            <div className="empty-icon">📊</div>
            <div className="empty-message">No table data to display</div>
          </div>
        ) : (
          <div className="data-table">
            <div className="table-container">
              <table className="main-table">
                <thead>
                  <tr>
                    {tableData.headers.map((header, index) => (
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
                      {tableData.headers.map((_, colIndex) => (
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
        .table-view {
          background: white;
          border-radius: 8px;  
          overflow: hidden;
          margin: 8px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
        }
        
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #fffbeb;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .format-tag {
          color: #d97706;
          font-size: 12px;
          font-weight: 600;
        }
        
        .error-indicator {
          font-size: 14px;
        }
        
        .data-info {
          font-size: 11px;
          color: #92400e;
          background: rgba(217, 119, 6, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .copy-button {
          background: #fef3c7;
          color: #d97706;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .copy-button:hover {
          background: #fde68a;
          color: #b45309;
        }
        
        .table-content {
          max-height: 500px;
          overflow: auto;
        }
        
        .streaming-table {
          padding: 16px;
        }
        
        .streaming-info {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 12px;
          font-style: italic;
        }
        
        .table-preview {
          background: #292524;
          color: #fafaf9;
          padding: 16px;
          border-radius: 6px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
          white-space: pre-wrap;
          margin: 0;
          overflow: auto;
        }
        
        .streaming-cursor {
          color: #d97706;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .table-error, .empty-table {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 250px;
          padding: 20px;
          text-align: center;
        }
        
        .table-error {
          color: #dc2626;
          background: #fef2f2;
        }
        
        .empty-table {
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
        
        .format-help {
          text-align: left;
          max-width: 600px;
          margin-bottom: 16px;
        }
        
        .format-help ul {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        .format-help li {
          margin-bottom: 4px;
          font-size: 13px;
        }
        
        .format-help code {
          background: #f3f4f6;
          padding: 2px 4px;
          border-radius: 2px;
          font-size: 12px;
          color: #374151;
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
        
        .data-table {
          padding: 0;
        }
        
        .table-container {
          overflow: auto;
          max-height: 500px;
        }
        
        .main-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .main-table th {
          background: #fffbeb;
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
          background: #fef7cd !important;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        
        .header-text {
          font-weight: 600;
          color: #78350f;
        }
        
        .sort-icon {
          font-size: 12px;
          color: #92400e;
        }
        
        .main-table td {
          padding: 8px;
          border-bottom: 1px solid #f9fafb;
          word-wrap: break-word;
          max-width: 200px;
        }
        
        .main-table tr:hover {
          background: #fffbeb;
        }
        
        .main-table tr:nth-child(even) {
          background: #fefce8;
        }
        
        .main-table tr:nth-child(even):hover {
          background: #fef3c7;
        }
      `}</style>
    </div>
  );
};

export default TableView;