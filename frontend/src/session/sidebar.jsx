import React from 'react';

const Sidebar = ({ 
  user, 
  sessions, 
  currentSession, 
  loading, 
  onCreateNewSession, 
  onLogout, 
  onSessionSelect 
}) => {
  return (
    <div style={{ 
      width: '300px', 
      backgroundColor: '#f5f5f5', 
      padding: '20px', 
      borderRight: '1px solid #ddd',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3>Chat Sessions</h3>
        {user && (
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Welcome, {user.username}!
          </div>
        )}
        <button
          onClick={onCreateNewSession}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          + New Chat
        </button>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div>
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSessionSelect(session.id)}
            style={{
              padding: '10px',
              backgroundColor: currentSession?.id === session.id ? '#007bff' : 'white',
              color: currentSession?.id === session.id ? 'white' : 'black',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '5px',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {session.session_name}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {new Date(session.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;