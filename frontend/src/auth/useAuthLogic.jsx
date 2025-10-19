import { useState } from 'react';
import { loginUser, registerUser } from '../api/auth';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';

const useAuthLogic = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let data;
      if (isLogin) {
        data = await loginUser(formData.email, formData.password);
        //
      } else {
        data = await registerUser(formData.username, formData.email, formData.password);
        //
      }
      
      // Store tokens
      localStorage.setItem(ACCESS_TOKEN, data.access_token);
      localStorage.setItem(REFRESH_TOKEN, data.refresh_token);
      
      // Redirect to home
      window.location.href = '/';
      
    } catch (err) {
      //
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      username: '',
      email: '',
      password: '',
    });
  };

  return {
    isLogin,
    loading,
    error,
    formData,
    handleChange,
    handleSubmit,
    toggleMode
  };
};

export default useAuthLogic;