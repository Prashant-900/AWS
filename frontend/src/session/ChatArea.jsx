import React from 'react';

const ChatArea = ({ 
  sessionId, 
  messages, 
  loading, 
  error,
  formatTime 
}) => {
  if (error) {
    return (
      <div style={{
        backgroundColor: '#fee',
        color: '#c33',
        padding: '10px',
        textAlign: 'center'
      }}>
        {error}
      </div>
    );
  }

  if (sessionId === 'new' || !sessionId) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#666'
      }}>
        <h2>Welcome to AI Chat!</h2>
        <p>Select an existing chat or create a new one to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      flex: 1, 
      padding: '20px', 
      overflowY: 'auto',
      backgroundColor: '#fafafa'
    }}>
      {loading && messages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666' }}>Loading messages...</div>
      ) : (
        messages.map((message, index) => (
          <div
            key={index}
            style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: message.sender === 'user' ? '#007bff' : '#e9ecef',
                color: message.sender === 'user' ? 'white' : 'black'
              }}
            >
              <div style={{ marginBottom: '4px' }}>
                {message.content}
              </div>
              <div style={{ 
                fontSize: '11px', 
                opacity: 0.7,
                textAlign: 'right'
              }}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatArea;