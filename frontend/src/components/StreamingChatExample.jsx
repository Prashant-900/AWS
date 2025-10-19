import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamChat, createSession, getSessions } from '../api/chat';
import { parseAgentContent, formatContentForDisplay, hasFormatTags } from '../utils/contentParser';

const StreamingChatExample = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [rawStreamingContent, setRawStreamingContent] = useState('');
  const abortStreamRef = useRef(null);

  const loadSessions = useCallback(async () => {
    try {
      const sessionsData = await getSessions();
      setSessions(sessionsData);
      if (sessionsData.length > 0 && !currentSession) {
        setCurrentSession(sessionsData[0]);
      }
    } catch {
      //
    }
  }, [currentSession]);

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const createNewSession = async () => {
    try {
      const newSession = await createSession();
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
    } catch {
      //
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isStreaming) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsStreaming(true);
    setStreamingContent('');
    setRawStreamingContent('');

    // Create AI message placeholder
    const aiMessageId = Date.now() + 1;
    const aiMessage = {
      id: aiMessageId,
      sender: 'ai',
      content: '',
      rawContent: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    };
    setMessages(prev => [...prev, aiMessage]);

    // Start streaming
    abortStreamRef.current = streamChat(
      currentSession.session_token,
      messageToSend,
      // onChunk - handle each chunk of streaming data
      (chunk) => {
        setRawStreamingContent(prev => prev + chunk);
        const newRawContent = rawStreamingContent + chunk;
        
        // Format the content for display
        let displayContent;
        if (hasFormatTags(newRawContent)) {
          // Parse and format structured content
          const blocks = parseAgentContent(newRawContent);
          displayContent = formatContentForDisplay(blocks);
        } else {
          // Plain text content
          displayContent = newRawContent;
        }
        
        setStreamingContent(displayContent);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: displayContent,
                  rawContent: newRawContent
                }
              : msg
          )
        );
      },
      // onEnd - handle streaming completion
      (endData) => {
        setIsStreaming(false);
        setStreamingContent('');
        setRawStreamingContent('');
        
        // Final formatting of the complete content
        const finalRawContent = endData?.full_content || rawStreamingContent;
        let finalDisplayContent;
        
        if (hasFormatTags(finalRawContent)) {
          const blocks = parseAgentContent(finalRawContent);
          finalDisplayContent = formatContentForDisplay(blocks);
        } else {
          finalDisplayContent = finalRawContent;
        }
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: finalDisplayContent,
                  rawContent: finalRawContent,
                  isStreaming: false, 
                  id: endData?.message_id || msg.id 
                }
              : msg
          )
        );
        abortStreamRef.current = null;
      },
      // onError - handle streaming errors
      () => {
        setIsStreaming(false);
        setStreamingContent('');
        setRawStreamingContent('');
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: 'Sorry, there was an error processing your message.', 
                  rawContent: '',
                  isStreaming: false, 
                  error: true 
                }
              : msg
          )
        );
        abortStreamRef.current = null;
      }
    );
  };

  const stopStreaming = () => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
      setIsStreaming(false);
      setStreamingContent('');
      setRawStreamingContent('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Streaming Chat Example</h2>
      
      {/* Session Management */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h3>Sessions</h3>
        <button onClick={createNewSession} style={{ marginRight: '10px' }}>
          New Session
        </button>
        <select 
          value={currentSession?.session_token || ''} 
          onChange={(e) => {
            const session = sessions.find(s => s.session_token === e.target.value);
            setCurrentSession(session);
            setMessages([]); // Clear messages when switching sessions
          }}
        >
          <option value="">Select a session</option>
          {sessions.map(session => (
            <option key={session.session_token} value={session.session_token}>
              {session.session_name} ({session.session_token.slice(0, 8)}...)
            </option>
          ))}
        </select>
      </div>

      {/* Chat Messages */}
      <div style={{ 
        height: '400px', 
        border: '1px solid #ccc', 
        borderRadius: '4px', 
        padding: '10px', 
        overflowY: 'auto',
        backgroundColor: '#f9f9f9'
      }}>
        {messages.map(message => (
          <div key={message.id} style={{
            marginBottom: '10px',
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: message.sender === 'user' ? '#e3f2fd' : '#f5f5f5',
            marginLeft: message.sender === 'user' ? '20%' : '0',
            marginRight: message.sender === 'user' ? '0' : '20%'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {message.sender === 'user' ? 'You' : 'AI'}
              {message.isStreaming && ' (streaming...)'}
              {message.error && ' (error)'}
              {message.rawContent && hasFormatTags(message.rawContent) && ' (formatted)'}
            </div>
            <div style={{ 
              whiteSpace: 'pre-wrap',
              fontFamily: message.content?.includes('```') ? 'monospace' : 'inherit'
            }}>
              {message.content}
              {message.isStreaming && '▋'} {/* Cursor effect */}
            </div>
            {/* Show raw content toggle for debugging */}
            {message.rawContent && hasFormatTags(message.rawContent) && !message.isStreaming && (
              <details style={{ marginTop: '8px', fontSize: '12px' }}>
                <summary style={{ cursor: 'pointer', color: '#666' }}>
                  Show raw content (with format tags)
                </summary>
                <pre style={{ 
                  backgroundColor: '#e8e8e8', 
                  padding: '4px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '11px',
                  marginTop: '4px'
                }}>
                  {message.rawContent}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={!currentSession || isStreaming}
          style={{
            flex: 1,
            minHeight: '40px',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            resize: 'vertical'
          }}
        />
        <button
          onClick={isStreaming ? stopStreaming : sendMessage}
          disabled={!currentSession || (!inputMessage.trim() && !isStreaming)}
          style={{
            padding: '8px 16px',
            backgroundColor: isStreaming ? '#f44336' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isStreaming ? 'Stop' : 'Send'}
        </button>
      </div>

      {/* Status */}
      <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        {!currentSession && 'Please select or create a session to start chatting'}
        {currentSession && !isStreaming && 'Ready to send messages'}
        {isStreaming && (
          <div>
            Streaming... ({rawStreamingContent.length} raw characters, {streamingContent.length} formatted characters)
            {hasFormatTags(rawStreamingContent) && ' - Contains format tags'}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamingChatExample;