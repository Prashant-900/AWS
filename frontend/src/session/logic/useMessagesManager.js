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
      console.log(`📥 Loading messages for session ${sessionToken}`);
      
      const messagesData = await getSessionMessages(sessionToken);
      setMessages(messagesData);
      console.log(`✅ Loaded ${messagesData.length} messages for session ${sessionToken}`);
      
      return messagesData;
    } catch (err) {
      console.error('❌ Failed to load messages:', err);
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
    console.log('📤 User message added:', userMessage.id);
    return userMessage;
  }, []);

  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    console.log('🗑️ Message removed:', messageId);
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
        console.log('💾 Adding final AI message to messages:', finalMessage.id);
        return [...prevMessages, finalMessage];
      }
      return prevMessages;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessage(null);
    console.log('🧹 Messages cleared');
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
    console.log('📤 Uploaded message added to messages:', message.id);
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