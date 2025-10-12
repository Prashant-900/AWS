import api from '../api';

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/user/login/', {
      email,
      password
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Login failed. Please try again.');
  }
};

export const registerUser = async (username, email, password) => {
  try {
    const response = await api.post('/user/register/', {
      username,
      email,
      password
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Registration failed. Please try again.');
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/user/profile/');
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to get user profile.');
  }
};

export const logoutUser = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
};

// Keep for compatibility but not implemented
export const loginWithGoogle = async () => {
  throw new Error('Google OAuth is not implemented in this version');
};