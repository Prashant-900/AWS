import React from 'react';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';
import { useParams } from 'react-router-dom';

const TokenDebugger = ({ connectionStatus, messagesCount }) => {
  const { sessionId } = useParams();
  const accessToken = localStorage.getItem(ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      fontSize: '11px',
      maxWidth: '300px',
      zIndex: 1000
    }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Debug Info</h4>
      <p><strong>Session ID:</strong> {sessionId || 'None'}</p>
      <p><strong>WebSocket:</strong> 
        <span style={{ 
          color: connectionStatus === 'connected' ? 'green' : 
                connectionStatus === 'connecting' ? 'orange' : 'red'
        }}>
          {connectionStatus || 'disconnected'}
        </span>
      </p>
      <p><strong>Messages:</strong> {messagesCount || 0}</p>
      <p><strong>Access Token:</strong> {accessToken ? '✅ Present' : '❌ Missing'}</p>
      <p><strong>Refresh Token:</strong> {refreshToken ? '✅ Present' : '❌ Missing'}</p>
      {accessToken && (
        <p><strong>Token Preview:</strong> {accessToken.substring(0, 15)}...</p>
      )}
    </div>
  );
};

export default TokenDebugger;