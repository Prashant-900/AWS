import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessions, createSession, getSessionMessages, sendMessage } from '../api/chat';
import { getUserProfile, logoutUser } from '../api/auth';

const useSessionLogic = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUserProfile = useCallback(async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setError('Failed to load user profile');
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const sessionsData = await getSessions();
      setSessions(sessionsData);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load sessions');
    }
  }, []);

  const loadSessionMessages = useCallback(async (id) => {
    try {
      setLoading(true);
      const messagesData = await getSessionMessages(id);
      setMessages(messagesData);
      
      // Find current session
      const session = sessions.find(s => s.id === parseInt(id));
      setCurrentSession(session);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [sessions]);

  useEffect(() => {
    loadUserProfile();
    loadSessions();
  }, [loadUserProfile, loadSessions]);

  useEffect(() => {
    if (sessionId && sessionId !== 'new') {
      loadSessionMessages(sessionId);
    } else {
      setMessages([]);
      setCurrentSession(null);
    }
  }, [sessionId, loadSessionMessages]);

  const handleCreateNewSession = async () => {
    try {
      setLoading(true);
      const newSessionData = await createSession();
      setSessions([newSessionData, ...sessions]);
      navigate(`/session/${newSessionData.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
      setError('Failed to create new session');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentSession) return;

    try {
      setLoading(true);
      const messageData = await sendMessage(currentSession.id, newMessage.trim());
      
      // Add both user and AI messages to the display
      setMessages([...messages, messageData.user_message, messageData.ai_message]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleSessionSelect = (id) => {
    navigate(`/session/${id}`);
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return {
    sessionId,
    user,
    sessions,
    currentSession,
    messages,
    newMessage,
    loading,
    error,
    handleCreateNewSession,
    handleSendMessage,
    handleLogout,
    handleSessionSelect,
    handleMessageChange,
    formatTime
  };
};

export default useSessionLogic;