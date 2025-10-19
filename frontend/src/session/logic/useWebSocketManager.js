import { useState, useCallback, useEffect } from 'react';
import useWebSocket from '../../hooks/useWebSocket';

/**
 * Hook for managing WebSocket connection and message streaming
 */
export const useWebSocketManager = (sessionToken, currentSession) => {
  const [wsConnectionStatus, setWsConnectionStatus] = useState('disconnected');
  const [error, setError] = useState('');

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data, messageHandlers) => {
    // Only handle messages for current session
    if (!sessionToken || sessionToken === 'new') {
      return;
    }
    
    const { setStreamingMessage, addFinalMessage, setMessagesLoading } = messageHandlers;
    
    switch (data.type) {
      case 'stream_start':
        setError(''); // Clear any timeout errors
        
        // Clear timeout if it exists
        if (window.currentMessageTimeout) {
          clearTimeout(window.currentMessageTimeout);
          window.currentMessageTimeout = null;
        }
        
        setStreamingMessage({
          id: data.message_id || data.messageId,
          content: '',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          isStreaming: true,
          sessionToken: sessionToken // Track which session this belongs to
        });
        break;
        
      case 'stream_chunk':
        setStreamingMessage(prev => {
          // Only update if message belongs to current session
          if (prev && (prev.id === data.message_id || prev.id === data.messageId) && prev.sessionToken === sessionToken) {
            return { ...prev, content: prev.content + data.content };
          }
          // Create new streaming message if none exists for current session
          if (!prev) {
            return {
              id: data.message_id || data.messageId,
              content: data.content,
              sender: 'ai',
              timestamp: new Date().toISOString(),
              isStreaming: true,
              sessionToken: sessionToken
            };
          }
          return prev; // Keep existing if not for current session
        });
        break;
        
      case 'stream_end':
        setStreamingMessage(prev => {
          // Only process if message belongs to current session
          if (prev && prev.sessionToken === sessionToken) {
            const finalMessage = {
              id: data.message?.id || data.message_id || `ai_${Date.now()}`,
              content: data.final_content || data.finalContent || prev.content || '',
              sender: 'ai',
              timestamp: data.message?.timestamp || new Date().toISOString(),
              isStreaming: false
            };
            
            // Add final message using handler
            addFinalMessage(finalMessage);
            
            return null; // Clear streaming message
          }
          return prev; // Keep streaming message if not for current session
        });
        setMessagesLoading(false); // Clear any loading state
        break;
        
      default:
    }
  }, [sessionToken]);

  // WebSocket error handler
  const handleWebSocketError = useCallback((errorMessage, messageHandlers) => {
    setError(`Connection error: ${errorMessage}`);
    
    const { setMessagesLoading, clearStreamingMessage } = messageHandlers;
    setMessagesLoading(false); // Clear loading state on error
    clearStreamingMessage(); // Clear any streaming message on error
  }, []);

  // WebSocket connection for real-time messaging (only when session is valid)
  const shouldConnect = sessionToken && sessionToken !== 'new' && currentSession;
  const { 
    connectionStatus,
    sendMessage: sendWebSocketMessage 
  } = useWebSocket(
    shouldConnect ? sessionToken : null,
    (data) => handleWebSocketMessage(data, window.messageHandlers || {}),
    (error) => handleWebSocketError(error, window.messageHandlers || {})
  );

  // Update connection status
  useEffect(() => {
    setWsConnectionStatus(connectionStatus);
  }, [connectionStatus]);

  return {
    wsConnectionStatus,
    wsError: error,
    sendWebSocketMessage,
    connectionStatus,
    setWsError: setError,
    handleWebSocketMessage,
    handleWebSocketError
  };
};