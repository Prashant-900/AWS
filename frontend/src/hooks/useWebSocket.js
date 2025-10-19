import { useState, useEffect, useRef, useCallback } from 'react';
import { ACCESS_TOKEN } from '../constants';
import { getConfig } from '../config';
const useWebSocket = (sessionToken, onMessage, onError) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isStreaming, setIsStreaming] = useState(false);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const heartbeatInterval = useRef(null);
  const currentSessionToken = useRef(sessionToken);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  
  // Update current session token and callbacks
  useEffect(() => {
    currentSessionToken.current = sessionToken;
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [sessionToken, onMessage, onError]);

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    try {
      const config = getConfig();
      const wsBaseUrl = config.WS_API_URL;
      
      if (wsBaseUrl) {
        // Use configured WebSocket base URL
        return `${wsBaseUrl}/ws/chat/${sessionToken}/`;
      }
    } catch {
      //
    }
    
    // Fallback to auto-detection for development
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
    const port = '8001'; // Default port
    return `${protocol}//${host}:${port}/ws/chat/${sessionToken}/`;
  }, [sessionToken]);

  // Send heartbeat to keep connection alive
  const sendHeartbeat = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!sessionToken) return;

    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      
      if (!token) {
          onErrorRef.current?.('No authentication token found');
        return;
      }

      setConnectionStatus('connecting');
      const wsUrl = `${getWebSocketUrl()}?token=${encodeURIComponent(token)}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // Start heartbeat
        heartbeatInterval.current = setInterval(sendHeartbeat, 30000); // 30 seconds

        // Send initial authentication
        ws.current.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // DEBUG: Log all messages from backend
          
          switch (data.type) {
            case 'connection':
              break;
              
            case 'authenticated':
              break;
              
            case 'message_received':
              break;
              
            case 'stream_start':
              setIsStreaming(true);
              onMessageRef.current?.({
                type: 'stream_start',
                messageId: data.message_id
              });
              break;
              
            case 'stream_chunk':
              onMessageRef.current?.({
                type: 'stream_chunk',
                content: data.content,
                messageId: data.message_id
              });
              break;
              
            case 'stream_end':
              setIsStreaming(false);
              onMessageRef.current?.({
                type: 'stream_end',
                messageId: data.message_id,
                finalContent: data.final_content
              });
              break;
              
            case 'error':
              onErrorRef.current?.(data.message || 'WebSocket error occurred');
              setIsStreaming(false);
              break;
              
            case 'heartbeat_ack':
              break;
              
            case 'heartbeat':
              break;
              
            default:
              onMessageRef.current?.(data);
          }
        } catch {
          onErrorRef.current?.('Failed to parse server message');
        }
      };

      ws.current.onclose = (event) => {
        setConnectionStatus('disconnected');
        setIsStreaming(false);
        
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }

        // Only attempt reconnection if it's not a normal closure and session hasn't changed
        if (event.code !== 1000 && 
            reconnectAttempts.current < maxReconnectAttempts && 
            currentSessionToken.current === sessionToken) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeout.current = setTimeout(() => {
            if (currentSessionToken.current === sessionToken) { // Double-check session hasn't changed
              reconnectAttempts.current++;
              connect();
            }
          }, timeout);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          onErrorRef.current?.('Failed to reconnect to WebSocket after multiple attempts');
        }
      };

      ws.current.onerror = () => {
        onErrorRef.current?.('WebSocket connection error');
      };

    } catch {
      setConnectionStatus('error');
      onErrorRef.current?.('Failed to create WebSocket connection');
    }
  }, [sessionToken, getWebSocketUrl, sendHeartbeat]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, 'User initiated disconnect');
      ws.current = null;
    }
    
    setConnectionStatus('disconnected');
    setIsStreaming(false);
    reconnectAttempts.current = 0;
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const messageData = {
        type: 'send_message',
        content: message
      };
      ws.current.send(JSON.stringify(messageData));
      return true;
    } else {
      onErrorRef.current?.('WebSocket is not connected');
      return false;
    }
  }, []);

  // Store connect and disconnect in refs to avoid dependency issues
  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);
  
  useEffect(() => {
    connectRef.current = connect;
    disconnectRef.current = disconnect;
  });

  // Connect when sessionToken changes
  useEffect(() => {
    if (sessionToken) {
      // Add small delay to prevent rapid reconnections
      const timer = setTimeout(() => {
        connectRef.current();
      }, 100);
      
      return () => {
        clearTimeout(timer);
        disconnectRef.current();
      };
    } else {
      disconnectRef.current();
    }
  }, [sessionToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    isStreaming,
    sendMessage,
    connect,
    disconnect
  };
};

export default useWebSocket;