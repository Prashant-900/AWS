import { logoutUser } from '../../api/auth';

/**
 * Action handlers for session operations
 */
export const useSessionActions = () => {
  
  const handleSendMessage = async (messageContent, connectionStatus, currentSession, handlers) => {
    const { addUserMessage, removeMessage, clearMessage, sendWebSocketMessage, setError } = handlers;
    
    if (!messageContent.trim()) return;

    console.log('🚀 handleSendMessage called with:', messageContent);
    console.log('📡 Connection status:', connectionStatus);
    console.log('📝 Current session:', currentSession);

    // Check if WebSocket is connected
    if (connectionStatus !== 'connected') {
      setError('Cannot send message - WebSocket not connected. Please wait for connection or refresh the page.');
      return;
    }

    if (!currentSession) {
      setError('Please select a chat session first.');
      return;
    }

    // Create user message immediately for UI
    const userMessage = addUserMessage(messageContent);
    clearMessage();
    setError(''); // Clear any previous errors

    console.log('📤 Sending message via WebSocket:', messageContent);
    // Send message via WebSocket only
    const success = sendWebSocketMessage(messageContent);
    if (!success) {
      setError('Failed to send message via WebSocket. Please check your connection.');
      // Remove user message if WebSocket send failed
      removeMessage(userMessage.id);
    }
  };

  const handleLogout = (navigate) => {
    logoutUser();
    navigate('/login');
  };

  const handleSessionSelect = (sessionId, navigate) => {
    navigate(`/session/${sessionId}`);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return {
    handleSendMessage,
    handleLogout,
    handleSessionSelect,
    formatTime
  };
};