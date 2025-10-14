import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useUserProfile,
  useSessionsManager,
  useMessagesManager,
  useWebSocketManager,
  useMessageInput,
  useSessionActions
} from './logic';

/**
 * Main session logic hook that orchestrates all session-related functionality
 * This hook has been refactored into smaller, focused pieces for better maintainability
 */
const useSessionLogic = () => {
  const { sessionToken } = useParams();
  const navigate = useNavigate();

  // Initialize all sub-hooks
  const {
    user,
    loadUserProfile,
    userError,
    setUserError
  } = useUserProfile();

  const {
    sessions,
    currentSession,
    sessionsLoading,
    sessionsError,
    loadSessions,
    handleCreateNewSession,
    selectSession,
    clearCurrentSession,
    setSessionsError
  } = useSessionsManager();

  const {
    messages,
    streamingMessage,
    messagesLoading,
    messagesError,
    loadSessionMessages,
    addUserMessage,
    removeMessage,
    addFinalMessage,
    clearMessages,
    setStreamingMessage,
    clearStreamingMessage,
    addUploadedMessage,
    setMessagesError,
    setMessagesLoading
  } = useMessagesManager();

  const {
    newMessage,
    handleMessageChange,
    clearMessage,
    getMessage
  } = useMessageInput();

  // Memoize the message handlers to prevent WebSocket reconnections
  const memoizedMessageHandlers = useMemo(() => ({
    setStreamingMessage,
    addFinalMessage,
    setMessagesLoading,
    clearStreamingMessage
  }), [setStreamingMessage, addFinalMessage, setMessagesLoading, clearStreamingMessage]);

  const {
    wsConnectionStatus,
    wsError,
    sendWebSocketMessage,
    connectionStatus,
    setWsError
  } = useWebSocketManager(sessionToken, currentSession);

  const {
    handleSendMessage,
    handleLogout,
    handleSessionSelect,
    formatTime
  } = useSessionActions();

  // Set up message handlers for WebSocket callbacks
  // This is needed because WebSocket callbacks need access to message functions
  window.messageHandlers = memoizedMessageHandlers;

  // Combined error state (prioritize user errors, then WebSocket, then others)
  const error = userError || wsError || sessionsError || messagesError;
  const loading = sessionsLoading || messagesLoading;

  // Initialize user profile on mount
  useEffect(() => {
    console.log('🎯 useSessionLogic: Loading user profile');
    loadUserProfile();
  }, [loadUserProfile]);

  // Initialize sessions after user is loaded
  useEffect(() => {
    if (user) {
      console.log('🎯 useSessionLogic: User loaded, loading sessions');
      loadSessions();
    }
  }, [user, loadSessions]);

  // Handle session changes and message loading
  useEffect(() => {
    console.log('🎯 useSessionLogic: Session/messages effect triggered', { 
      sessionToken, 
      sessionsLength: sessions.length 
    });
    
    if (sessionToken && sessionToken !== 'new' && sessions.length > 0) {
      const session = selectSession(sessionToken, sessions);
      if (session) {
        console.log('🎯 useSessionLogic: Loading messages for session', sessionToken);
        loadSessionMessages(sessionToken);
      }
    } else {
      console.log('🎯 useSessionLogic: Clearing messages and session');
      clearMessages();
      clearCurrentSession();
    }
    // Clear streaming message when switching sessions
    clearStreamingMessage();
  }, [sessionToken, sessions, selectSession, loadSessionMessages, clearMessages, clearCurrentSession, clearStreamingMessage]);

  // Enhanced message sending handler
  const enhancedHandleSendMessage = async (e, data = null) => {
    e.preventDefault();
    
    // Handle new data format with files or fallback to old format
    const messageContent = data?.message || getMessage();
    const attachedFiles = data?.files || [];
    
    console.log('📎 Sending message with files:', {
      messageContent,
      filesCount: attachedFiles.length,
      files: attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
    
    await handleSendMessage(messageContent, connectionStatus, currentSession, {
      addUserMessage,
      removeMessage,
      clearMessage,
      sendWebSocketMessage,
      setError: (error) => {
        setWsError(error);
        setMessagesError(error);
        setUserError(error);
        setSessionsError(error);
      }
    }, attachedFiles);
  };

  // Enhanced session creation handler
  const enhancedCreateNewSession = async () => {
    try {
      await handleCreateNewSession(navigate);
    } catch (error) {
      // Error is already handled in the hook
      console.error('Session creation failed:', error);
    }
  };

  // Enhanced logout handler
  const enhancedHandleLogout = () => {
    handleLogout(navigate);
  };

  // Enhanced session selection handler
  const enhancedHandleSessionSelect = (id) => {
    handleSessionSelect(id, navigate);
  };

  // Clean up message handlers on unmount
  useEffect(() => {
    return () => {
      if (window.messageHandlers) {
        delete window.messageHandlers;
      }
    };
  }, []);

  return {
    // Session state
    sessionToken,
    user,
    sessions,
    currentSession,
    
    // Message state
    messages,
    newMessage,
    streamingMessage,
    
    // Status state
    loading,
    error,
    wsConnectionStatus,
    
    // Action handlers
    handleCreateNewSession: enhancedCreateNewSession,
    handleSendMessage: enhancedHandleSendMessage,
    handleLogout: enhancedHandleLogout,
    handleSessionSelect: enhancedHandleSessionSelect,
    handleMessageChange,
    formatTime,
    addUploadedMessage
  };
};

export default useSessionLogic;