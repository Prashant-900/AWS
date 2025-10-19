import { useState, useCallback } from 'react';
import { getSessionMessages } from '../../api/chat';

/**
 * Hook for managing chat messages state and operations
 */
export const useMessagesManager = () => {
  const [messages, setMessages] = useState([]);
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSessionMessages = useCallback(async (sessionToken) => {
    if (!sessionToken || sessionToken === 'new') {
      setMessages([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      const messagesData = await getSessionMessages(sessionToken);
      setMessages(messagesData);
      
      return messagesData;
    } catch (err) {
      setError('Failed to load messages');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addUserMessage = useCallback((content) => {
    const userMessage = {
      id: Date.now(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    return userMessage;
  }, []);

  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const addFinalMessage = useCallback((finalMessage) => {
    if (!finalMessage.content.trim()) return;

    setMessages(prevMessages => {
      // More robust duplicate prevention
      const exists = prevMessages.some(msg => {
        const isSameSender = msg.sender === 'ai';
        const isSameContent = msg.content.trim() === finalMessage.content.trim();
        const isSameId = msg.id && msg.id === finalMessage.id;
        return isSameSender && (isSameContent || isSameId);
      });
      
      if (!exists) {
        return [...prevMessages, finalMessage];
      }
      return prevMessages;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessage(null);
  }, []);

  const clearStreamingMessage = useCallback(() => {
    setStreamingMessage(null);
  }, []);

  const addUploadedMessage = useCallback((messageData) => {
    // Add a message that was uploaded with files to the messages list
    const message = {
      id: messageData.id,
      content: messageData.content,
      sender: messageData.sender,
      timestamp: messageData.timestamp,
      files: messageData.files || []
    };

    setMessages(prev => [...prev, message]);
  }, []);

  return {
    messages,
    streamingMessage,
    messagesLoading: loading,
    messagesError: error,
    loadSessionMessages,
    addUserMessage,
    removeMessage,
    addFinalMessage,
    clearMessages,
    setStreamingMessage,
    clearStreamingMessage,
    addUploadedMessage,
    setMessagesError: setError,
    setMessagesLoading: setLoading
  };
};