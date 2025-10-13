import { useState, useEffect, useRef, useCallback } from 'react';
import { ACCESS_TOKEN } from '../constants';

const useWebSocket = (sessionId, onMessage, onError) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isStreaming, setIsStreaming] = useState(false);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const heartbeatInterval = useRef(null);
  const currentSessionId = useRef(sessionId);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  
  // Update current session ID and callbacks
  useEffect(() => {
    currentSessionId.current = sessionId;
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [sessionId, onMessage, onError]);

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '8000'; // Django default port
    return `${protocol}//${host}:${port}/ws/chat/${sessionId}/`;
  }, [sessionId]);

  // Send heartbeat to keep connection alive
  const sendHeartbeat = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!sessionId) return;

    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      console.log('WebSocket connecting with token:', token ? 'Token found' : 'No token');
      
      if (!token) {
          onErrorRef.current?.('No authentication token found');
        return;
      }

      setConnectionStatus('connecting');
      const wsUrl = `${getWebSocketUrl()}?token=${encodeURIComponent(token)}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log(`WebSocket connected for session: ${sessionId}`);
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
          console.log('🔽 WebSocket message received:', data);
          
          switch (data.type) {
            case 'connection':
              console.log('✅ WebSocket connection confirmed:', data);
              break;
              
            case 'authenticated':
              console.log('✅ WebSocket authentication confirmed:', data);
              break;
              
            case 'message_received':
              console.log('📩 User message confirmed saved:', data);
              break;
              
            case 'stream_start':
              console.log('🚀 AI streaming started:', data);
              setIsStreaming(true);
              onMessageRef.current?.({
                type: 'stream_start',
                messageId: data.message_id
              });
              break;
              
            case 'stream_chunk':
              console.log('📝 AI chunk received:', data.content);
              onMessageRef.current?.({
                type: 'stream_chunk',
                content: data.content,
                messageId: data.message_id
              });
              break;
              
            case 'stream_end':
              console.log('✅ AI streaming completed:', data);
              setIsStreaming(false);
              onMessageRef.current?.({
                type: 'stream_end',
                messageId: data.message_id,
                finalContent: data.final_content
              });
              break;
              
            case 'error':
              console.error('❌ WebSocket error:', data);
              onErrorRef.current?.(data.message || 'WebSocket error occurred');
              setIsStreaming(false);
              break;
              
            case 'heartbeat_ack':
              console.log('💓 Heartbeat acknowledged');
              break;
              
            case 'heartbeat':
              console.log('💓 Heartbeat from server');
              break;
              
            default:
              console.log('❓ Unknown message type:', data);
              onMessageRef.current?.(data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, 'Raw data:', event.data);
          onErrorRef.current?.('Failed to parse server message');
        }
      };

      ws.current.onclose = (event) => {
        console.log(`WebSocket disconnected for session ${sessionId}:`, event.code, event.reason);
        setConnectionStatus('disconnected');
        setIsStreaming(false);
        
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }

        // Only attempt reconnection if it's not a normal closure and session hasn't changed
        if (event.code !== 1000 && 
            reconnectAttempts.current < maxReconnectAttempts && 
            currentSessionId.current === sessionId) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect to session ${sessionId} in ${timeout}ms...`);
          
          reconnectTimeout.current = setTimeout(() => {
            if (currentSessionId.current === sessionId) { // Double-check session hasn't changed
              reconnectAttempts.current++;
              connect();
            }
          }, timeout);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          onErrorRef.current?.('Failed to reconnect to WebSocket after multiple attempts');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onErrorRef.current?.('WebSocket connection error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('error');
      onErrorRef.current?.('Failed to create WebSocket connection');
    }
  }, [sessionId, getWebSocketUrl, sendHeartbeat]);

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
      console.log('🔼 Sending message to WebSocket:', messageData);
      ws.current.send(JSON.stringify(messageData));
      return true;
    } else {
      console.error('❌ Cannot send message - WebSocket not connected. ReadyState:', ws.current?.readyState);
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

  // Connect when sessionId changes
  useEffect(() => {
    if (sessionId) {
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
  }, [sessionId]);

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