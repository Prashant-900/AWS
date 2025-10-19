import api from '../api';
import { ACCESS_TOKEN } from '../constants';
import { getConfig } from '../config';
export const getSessions = async () => {
  try {
    const response = await api.get('/chats/');
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to get sessions.');
  }
};

export const createSession = async (sessionName = 'New Chat') => {
  try {
    const response = await api.post('/chats/create/', {
      session_name: sessionName
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to create session.');
  }
};

export const getSessionMessages = async (sessionToken) => {
  try {
    const response = await api.get(`/chats/${sessionToken}/messages/`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to get messages.');
  }
};

export const deleteSession = async (sessionToken) => {
  try {
    const response = await api.delete(`/chats/${sessionToken}/delete/`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to delete session.');
  }
};

/**
 * Stream chat response using Server-Sent Events
 * @param {string} sessionToken - The chat session token
 * @param {string} message - The user message
 * @param {function} onChunk - Callback for each chunk of data
 * @param {function} onEnd - Callback when streaming ends
 * @param {function} onError - Callback for errors
 * @returns {function} - Function to abort the stream
 */
export const streamChat = (sessionToken, message, onChunk, onEnd, onError) => {
  const { API_URL } = getConfig();
  const controller = new AbortController();
  
  const baseURL = API_URL;
  const token = localStorage.getItem(ACCESS_TOKEN);
  
  fetch(`${baseURL}/chats/${sessionToken}/stream/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/plain',
    },
    body: JSON.stringify({ message }),
    signal: controller.signal,
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    function readStream() {
      return reader.read().then(({ done, value }) => {
        if (done) {
          if (onEnd) onEnd();
          return;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)); // Remove 'data: ' prefix
              
              if (data.type === 'chunk' && data.content) {
                if (onChunk) onChunk(data.content);
              } else if (data.type === 'end') {
                if (onEnd) onEnd(data);
                return;
              } else if (data.type === 'error') {
                if (onError) onError(new Error(data.error || 'Unknown error'));
                return;
              }
            } catch {
              // Ignore JSON parsing errors for incomplete chunks
              continue;
            }
          }
        }
        
        return readStream();
      });
    }
    
    return readStream();
  })
  .catch(error => {
    if (error.name === 'AbortError') {
      //
    } else if (onError) {
      onError(error);
    }
  });
  
  // Return abort function
  return () => controller.abort();
};