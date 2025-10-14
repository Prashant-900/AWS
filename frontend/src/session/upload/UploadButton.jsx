import React, { forwardRef } from 'react';

/**
 * Upload button component that triggers the upload popup
 */
const UploadButton = forwardRef(({ onClick, disabled = false }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 12px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: disabled ? '#f5f5f5' : '#007bff',
        color: disabled ? '#999' : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        outline: 'none',
        minWidth: '40px',
        height: '40px',
        justifyContent: 'center',
        ...(disabled ? {} : {
          ':hover': {
            backgroundColor: '#0056b3',
            transform: 'translateY(-1px)'
          }
        })
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = '#0056b3';
          e.target.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = '#007bff';
          e.target.style.transform = 'translateY(0)';
        }
      }}
      title="Add files (images, documents)"
    >
      <span style={{ fontSize: '16px' }}>📎</span>
      <span style={{ display: 'none' }}>Add Files</span>
      
      <style jsx>{`
        @media (max-width: 768px) {
          button span:last-child {
            display: none !important;
          }
        }
        
        @media (min-width: 769px) {
          button {
            min-width: auto !important;
          }
          button span:last-child {
            display: inline !important;
          }
        }
      `}</style>
    </button>
  );
});

export default UploadButton;