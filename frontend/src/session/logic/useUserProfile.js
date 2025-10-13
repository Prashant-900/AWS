import { useState, useCallback } from 'react';
import { getUserProfile } from '../../api/auth';

/**
 * Hook for managing user profile state and operations
 */
export const useUserProfile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const loadUserProfile = useCallback(async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
      setError(''); // Clear any previous errors
      console.log('✅ User profile loaded:', userData.username);
    } catch (err) {
      console.error('❌ Failed to load user profile:', err);
      setError('Failed to load user profile');
    }
  }, []);

  const clearUser = () => {
    setUser(null);
    setError('');
  };

  return {
    user,
    loadUserProfile,
    clearUser,
    userError: error,
    setUserError: setError
  };
};