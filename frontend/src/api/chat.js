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