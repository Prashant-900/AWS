import { useState, useCallback } from 'react';
import { getSessions, createSession } from '../../api/chat';

/**
 * Hook for managing chat sessions state and operations
 */
export const useSessionsManager = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const sessionsData = await getSessions();
      setSessions(sessionsData);
      setError(''); // Clear any previous errors
      console.log('✅ Sessions loaded:', sessionsData.length);
    } catch (err) {
      console.error('❌ Failed to load sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateNewSession = async (navigate) => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const newSessionData = await createSession();
      setSessions(prevSessions => [newSessionData, ...prevSessions]);
      console.log('✅ New session created:', newSessionData.id);
      
      if (navigate) {
        navigate(`/session/${newSessionData.id}`);
      }
      
      return newSessionData;
    } catch (err) {
      console.error('❌ Failed to create session:', err);
      setError('Failed to create new session. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const selectSession = useCallback((sessionId, sessionsList) => {
    const session = (sessionsList || sessions).find(s => s.id === parseInt(sessionId));
    setCurrentSession(session);
    console.log('📌 Session selected:', session?.id);
    return session;
  }, [sessions]);

  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  return {
    sessions,
    currentSession,
    sessionsLoading: loading,
    sessionsError: error,
    loadSessions,
    handleCreateNewSession,
    selectSession,
    clearCurrentSession,
    setSessionsError: setError
  };
};