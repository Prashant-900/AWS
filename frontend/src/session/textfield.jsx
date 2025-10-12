import React from 'react';

const MessageInput = ({ 
  newMessage, 
  loading, 
  onMessageChange, 
  onSubmit 
}) => {
  return (
    <div style={{ 
      padding: '20px', 
      borderTop: '1px solid #ddd',
      backgroundColor: 'white'
    }}>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={onMessageChange}
          placeholder="Type your message..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '25px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading || !newMessage.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            opacity: loading || !newMessage.trim() ? 0.5 : 1
          }}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;