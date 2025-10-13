import React, { useEffect, useRef } from 'react';

const ChatArea = ({ 
  sessionId, 
  messages, 
  loading, 
  error,
  formatTime,
  connectionStatus,
  streamingMessage
}) => {
  const messagesEndRef = useRef(null);
  
  const scrollContainerRef = useRef(null);
  
  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Ensure scroll container is properly positioned
    if (scrollContainerRef.current) {
      // Reset scroll position if needed to ensure first message is visible
      if (messages.length === 1) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
    
    // Auto-scroll to bottom for new messages
    scrollToBottom();
  }, [messages, streamingMessage]);
  
  // All WebSocket handling is now managed in useSessionLogic hook

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fee',
        color: '#c33',
        padding: '10px',
        textAlign: 'center',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {error}
      </div>
    );
  }

  if (sessionId === 'new' || !sessionId) {
    return (
      <div style={{ 
        width: '100%',
        height: '100%',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#666',
        backgroundColor: '#fafafa',
        padding: '20px',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '16px', color: '#333' }}>Welcome to AI Chat!</h2>
          <p style={{ marginBottom: '24px', lineHeight: 1.5 }}>
            Select an existing chat from the sidebar or create a new one to get started.
          </p>
          <div style={{ 
            fontSize: '14px', 
            color: '#888',
            fontStyle: 'italic'
          }}>
            💬 Start chatting with AI assistant
          </div>
        </div>
      </div>
    );
  }

  // Only show streaming message if it belongs to current session
  // and prevent duplicate messages by checking if streaming content 
  // already exists in messages
  const hasStreamingContent = streamingMessage?.content && 
    !messages.some(msg => msg.content === streamingMessage.content && msg.sender === 'ai');
    
  const allMessages = (hasStreamingContent && streamingMessage) 
    ? [...messages, streamingMessage]
    : messages;
    
  console.log('📊 ChatArea render:', {
    sessionId,
    messagesCount: messages.length,
    streamingMessage: streamingMessage?.content?.substring(0, 50),
    hasStreamingContent,
    allMessagesCount: allMessages.length,
    loading: loading,
    connectionStatus: connectionStatus
  });

    return (
      <div style={{ 
        width: '100%',
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
      {/* Connection Status Indicator */}
      {sessionId && sessionId !== 'new' && connectionStatus === 'connecting' && (
        <div style={{
          padding: '4px 16px',
          textAlign: 'center',
          fontSize: '11px',
          backgroundColor: '#e7f3ff',
          color: '#0066cc',
          borderBottom: '1px solid #dee2e6',
          flexShrink: 0
        }}>
          🔄 Connecting to real-time chat...
        </div>
      )}      {/* Messages Area - Scrollable */}
      <div 
        ref={scrollContainerRef}
        style={{ 
          flex: 1, 
          padding: '20px', 
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#fafafa',
          minHeight: 0,
          boxSizing: 'border-box'
        }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          minHeight: 'min-content',
          width: '100%'
        }}>
          {loading && allMessages.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '50px 0',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              Loading messages...
            </div>
          )}
            {allMessages.map((message, index) => (
              <div
                key={`${sessionId}-${message.id || message.message_id || `temp-${index}`}`}
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
                    color: message.sender === 'user' ? 'white' : 'black',
                    position: 'relative',
                    ...(message.isStreaming && {
                      opacity: 0.8,
                      animation: 'pulse 2s infinite'
                    })
                  }}
                >
                  <div style={{ 
                    marginBottom: message.isStreaming ? '8px' : '4px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {message.content}
                  </div>
                  
                  {message.isStreaming && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        width: '3px',
                        height: '3px',
                        backgroundColor: 'currentColor',
                        borderRadius: '50%',
                        animation: 'blink 1.4s infinite both',
                        marginRight: '2px'
                      }}></div>
                      <div style={{
                        width: '3px',
                        height: '3px',
                        backgroundColor: 'currentColor',
                        borderRadius: '50%',
                        animation: 'blink 1.4s infinite both',
                        animationDelay: '0.2s',
                        marginRight: '2px'
                      }}></div>
                      <div style={{
                        width: '3px',
                        height: '3px',
                        backgroundColor: 'currentColor',
                        borderRadius: '50%',
                        animation: 'blink 1.4s infinite both',
                        animationDelay: '0.4s'
                      }}></div>
                    </div>
                  )}
                  
                  {!message.isStreaming && (
                    <div style={{ 
                      fontSize: '11px', 
                      opacity: 0.7,
                      textAlign: 'right'
                    }}>
                      {formatTime(message.timestamp)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          } 40% { 
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatArea;