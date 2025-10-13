import React from 'react';
import Sidebar from './sidebar';
import ChatArea from './ChatArea';
import MessageInput from './textfield';
import useSessionLogic from './useSessionLogic.jsx';
import TokenDebugger from '../components/TokenDebugger';
import { useWhyDidYouUpdate } from '../hooks/useWhyDidYouUpdate';

export default function Session() {
  const sessionLogicData = useSessionLogic();
  const {
    sessionId,
    user,
    sessions,
    currentSession,
    messages,
    newMessage,
    loading,
    error,
    wsConnectionStatus,
    streamingMessage,
    handleCreateNewSession,
    handleSendMessage,
    handleLogout,
    handleSessionSelect,
    handleMessageChange,
    formatTime
  } = sessionLogicData;

  // Debug re-renders
  useWhyDidYouUpdate('Session', sessionLogicData);
  
  console.log('🎬 Session component rendered with:', {
    sessionId,
    wsConnectionStatus,
    messagesCount: messages.length,
    sessionsCount: sessions.length,
    loading,
    error
  });

  // Show error message if there's a general error
  if (error && !sessionId) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#fee',
          color: '#c33',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '400px',
          maxHeight: '300px',
          overflow: 'hidden'
        }}>
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gridTemplateRows: '1fr auto',
      gridTemplateAreas: `
        "sidebar chatarea"
        "sidebar textfield"
      `,
      height: '100vh', 
      width: '100vw',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <TokenDebugger 
        connectionStatus={wsConnectionStatus} 
        messagesCount={messages.length}
      />
      
      <div style={{ gridArea: 'sidebar' }}>
        <Sidebar
          user={user}
          sessions={sessions}
          currentSession={currentSession}
          loading={loading}
          onCreateNewSession={handleCreateNewSession}
          onLogout={handleLogout}
          onSessionSelect={handleSessionSelect}
        />
      </div>

      <div style={{ 
        gridArea: 'chatarea',
        backgroundColor: 'white',
        overflow: 'hidden'
      }}>
        <ChatArea
          sessionId={sessionId}
          messages={messages}
          loading={loading}
          error={error}
          formatTime={formatTime}
          connectionStatus={wsConnectionStatus}
          streamingMessage={streamingMessage}
        />
      </div>

      {(sessionId && sessionId !== 'new') || (!sessionId && currentSession) ? (
        <div style={{ gridArea: 'textfield' }}>
          <MessageInput
            newMessage={newMessage}
            onMessageChange={handleMessageChange}
            onSubmit={handleSendMessage}
          />
        </div>
      ) : null}
    </div>
  );
}
