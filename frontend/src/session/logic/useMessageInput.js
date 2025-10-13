import { useState } from 'react';

/**
 * Hook for managing form state and input handling
 */
export const useMessageInput = () => {
  const [newMessage, setNewMessage] = useState('');

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };

  const clearMessage = () => {
    setNewMessage('');
  };

  const getMessage = () => {
    return newMessage.trim();
  };

  return {
    newMessage,
    handleMessageChange,
    clearMessage,
    getMessage
  };
};