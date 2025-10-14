import { logoutUser } from '../../api/auth';

/**
 * Action handlers for session operations
 */
export const useSessionActions = () => {
  
  const handleSendMessage = async (messageContent, connectionStatus, currentSession, handlers, attachedFiles = []) => {
    const { addUserMessage, removeMessage, clearMessage, sendWebSocketMessage, setError } = handlers;
    
    // Check if we have either message content or files
    const hasMessage = messageContent && messageContent.trim();
    const hasFiles = attachedFiles && attachedFiles.length > 0;
    
    if (!hasMessage && !hasFiles) {
      return; // Nothing to send
    }

    console.log('🚀 handleSendMessage called with:', {
      messageContent,
      filesCount: attachedFiles.length,
      files: attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
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

    // Format message content for display (include file info)
    let displayContent = messageContent || '';
    if (hasFiles) {
      const filesList = attachedFiles.map(f => `📎 ${f.name}`).join('\n');
      displayContent = hasMessage 
        ? `${messageContent}\n\n${filesList}`
        : filesList;
    }

    // Create user message immediately for UI
    const userMessage = addUserMessage(displayContent);
    clearMessage();
    setError(''); // Clear any previous errors

    console.log('📤 Sending message via WebSocket:', { messageContent, filesCount: attachedFiles.length });
    
    // Prepare message data for WebSocket
    const messageData = {
      content: messageContent || '',
      files: attachedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        // Note: We're not sending the actual file data via WebSocket for now
        // This would typically be handled by a separate file upload API
      }))
    };

    // Send message via WebSocket only
    const success = sendWebSocketMessage(hasFiles ? messageData : messageContent);
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