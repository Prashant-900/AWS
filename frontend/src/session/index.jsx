import React from 'react';
import Sidebar from './sidebar';
import ChatArea from './ChatArea';
import MessageInput from './textfield';
import useSessionLogic from './useSessionLogic.jsx';

export default function Session() {
  const {
    sessionId,
    user,
    sessions,
    currentSession,
    messages,
    newMessage,
    loading,
    error,
    handleCreateNewSession,
    handleSendMessage,
    handleLogout,
    handleSessionSelect,
    handleMessageChange,
    formatTime
  } = useSessionLogic();

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <Sidebar
        user={user}
        sessions={sessions}
        currentSession={currentSession}
        loading={loading}
        onCreateNewSession={handleCreateNewSession}
        onLogout={handleLogout}
        onSessionSelect={handleSessionSelect}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ChatArea
          sessionId={sessionId}
          messages={messages}
          loading={loading}
          error={error}
          formatTime={formatTime}
        />

        {sessionId && sessionId !== 'new' && (
          <MessageInput
            newMessage={newMessage}
            loading={loading}
            onMessageChange={handleMessageChange}
            onSubmit={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
}
