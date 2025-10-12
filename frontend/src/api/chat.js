import api from '../api';

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

export const getSessionMessages = async (sessionId) => {
  try {
    const response = await api.get(`/chats/${sessionId}/messages/`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to get messages.');
  }
};

export const sendMessage = async (sessionId, content) => {
  try {
    const response = await api.post('/chats/message/send/', {
      session_id: sessionId,
      content
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to send message.');
  }
};

export const saveMessage = async (sessionId, sender, content) => {
  try {
    const response = await api.post('/chats/message/save/', {
      session_id: sessionId,
      sender,
      content
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to save message.');
  }
};