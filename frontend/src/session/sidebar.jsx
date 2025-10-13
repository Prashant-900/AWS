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
      width: '100%',
      height: '100vh',
      backgroundColor: '#f8f9fa', 
      padding: '20px', 
      borderRight: '1px solid #e9ecef',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        marginBottom: '20px',
        flexShrink: 0,
        paddingBottom: '10px',
        borderBottom: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Chat Sessions</h3>
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

      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        paddingTop: '10px',
        minHeight: 0
      }}>
        {sessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '14px',
            fontStyle: 'italic',
            padding: '20px 0'
          }}>
            No chat sessions yet. Create your first one!
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSessionSelect(session.id)}
              style={{
                padding: '12px',
                backgroundColor: currentSession?.id === session.id ? '#007bff' : 'white',
                color: currentSession?.id === session.id ? 'white' : 'black',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: currentSession?.id === session.id ? '0 2px 4px rgba(0,123,255,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                ':hover': {
                  backgroundColor: currentSession?.id === session.id ? '#0056b3' : '#f8f9fa'
                }
              }}
            >
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '14px',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {session.session_name || `Chat ${session.id}`}
              </div>
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {new Date(session.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;