import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import EmojiPicker from './EmojiPicker';
import Toast from './Toast';

export default function Chat({ username }) {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const [reactionPickerForMsgId, setReactionPickerForMsgId] = useState(null);
  const [typingUser, setTypingUser] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [notification, setNotification] = useState('');
  const messagesEndRef = useRef();
  const socketRef = useRef();
  const typingTimeoutRef = useRef();
useEffect(() => {
  const backendUrl = process.env.REACT_APP_API_URL;
  socketRef.current = io(backendUrl, { query: { username } });
  




    // Listen for regular messages
    socketRef.current.on('message', (msg) => {
      setMessages((m) => {
        if (m.find(existing => existing.id === msg.id)) {
          return m.map(existing => existing.id === msg.id ? { ...existing, status: msg.status } : existing);
        }
        return [...m, msg];
      });

      if (msg.user !== username) {
        socketRef.current.emit('messageReceived', {
          msgId: msg.id,
          senderSocketId: msg.senderSocketId
        });

        socketRef.current.emit('readMessage', {
          msgId: msg.id,
          senderSocketId: msg.senderSocketId
        });
      }
    });

    // Listen for file messages
    socketRef.current.on('fileMessage', (msg) => {
      setMessages((m) => {
        if (m.find(existing => existing.id === msg.id)) {
          return m.map(existing => existing.id === msg.id ? { ...existing, status: msg.status } : existing);
        }
        return [...m, msg];
      });

      if (msg.user !== username) {
        socketRef.current.emit('messageReceived', {
          msgId: msg.id,
          senderSocketId: msg.senderSocketId
        });

        socketRef.current.emit('readMessage', {
          msgId: msg.id,
          senderSocketId: msg.senderSocketId
        });
      }
    });

    // Listen for system messages (user joined/left)
    socketRef.current.on('systemMessage', (msg) => {
      setMessages((m) => [...m, { ...msg, system: true }]);
    });
    

    // Listen for status updates
    socketRef.current.on('messageStatusUpdate', ({ msgId, status }) => {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === msgId ? { ...msg, status } : msg
        )
      );
    });

    socketRef.current.on('userJoined', (msg) => showNotification(msg));
    socketRef.current.on('userLeft', (msg) => showNotification(msg));
    socketRef.current.on('activeUsers', (users) => setActiveUsers(users));

    socketRef.current.on('typing', (user) => {
      setTypingUser(user);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(''), 4000);
    });

    socketRef.current.on('stopTyping', () => {
      setTypingUser('');
      clearTimeout(typingTimeoutRef.current);
    });

    socketRef.current.on('reactUpdate', ({ msgId, emoji }) =>
      setMessages((m) =>
        m.map((msg) =>
          msg.id === msgId ? { ...msg, reactions: [...(msg.reactions || []), emoji] } : msg
        )
      )
    );

    return () => {
      socketRef.current.disconnect();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2200);
  };

  const handleChange = (e) => {
    setMessageInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messageInput.trim()) {
        sendMessage(messageInput);
      }
    }
  };

  const sendMessage = (text, replyTo) => {
    if (!text.trim()) return;

    const message = {
      id: Date.now(),
      text,
      user: username,
      replyTo: replyTo || null,
      avatarUrl: `https://ui-avatars.com/api/?name=${username}&background=random`,
      senderSocketId: socketRef.current.id,
      status: 'sent',
    };

    socketRef.current.emit('sendMessage', message);
    setMessageInput('');
    setShowInputEmojiPicker(false);
    socketRef.current.emit('stopTyping', username);
  };

  const sendFile = () => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      const fileMessage = {
        id: Date.now(),
        user: username,
        avatarUrl: `https://ui-avatars.com/api/?name=${username}&background=random`,
        senderSocketId: socketRef.current.id,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        data: base64Data,
        status: 'sent',
      };
      socketRef.current.emit('sendFile', fileMessage);
      setSelectedFile(null);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleTyping = () => {
    if (!socketRef.current) return;

    socketRef.current.emit('typing', username);

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stopTyping', username);
    }, 3000);
  };

  const reactToMsg = (msgId, emoji) => {
    socketRef.current.emit('reactMessage', msgId, emoji);
  };

  const handleInputEmojiSelect = (emoji) => {
    setMessageInput((prev) => prev + emoji);
    setShowInputEmojiPicker(false);
  };

  const handleReactEmojiSelect = (emoji) => {
    if (reactionPickerForMsgId) {
      reactToMsg(reactionPickerForMsgId, emoji);
      setReactionPickerForMsgId(null);
    }
  };

  return (
    <div style={{ width: 500, border: '1px solid #ccc', padding: 10, margin: 'auto', background: "#fafaff", borderRadius: 13 }}>
      <Toast message={notification} />
      <div className="active-users-container">
        <h4>Active Users ({activeUsers.length}):</h4>
        <ul>
          {activeUsers.map((user, i) => (
            <li key={user + i}>{user}</li>
          ))}
        </ul>
      </div>

      <TypingIndicator typingUser={typingUser} />

      <div className="input-container">
        <textarea
          className="chat-input"
          placeholder="Type your message..."
          rows={2}
          value={messageInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button className="emoji-picker-btn" onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}>😀</button>
        <button
          className="send-btn"
          onClick={() => sendMessage(messageInput)}
          disabled={!messageInput.trim()}
        >
          ➤
        </button>
      </div>

      {showInputEmojiPicker && <EmojiPicker onSelect={handleInputEmojiSelect} />}

      <div style={{ marginBottom: 12 }}>
        <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
        <button onClick={sendFile} disabled={!selectedFile} style={{ marginLeft: 8 }}>
          Send File
        </button>
      </div>

      <div>
        {messages.map((msg) => (
          <Message
            key={msg.id}
            msg={{
              ...msg,
              reply: msg.replyTo ? messages.find((m) => m.id === msg.replyTo)?.text || '' : null,
            }}
            onReactClick={() => setReactionPickerForMsgId(msg.id)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {reactionPickerForMsgId && (
        <div style={{ position: 'fixed', bottom: 100, left: 50, zIndex: 100 }}>
          <EmojiPicker onSelect={handleReactEmojiSelect} />
          <button onClick={() => setReactionPickerForMsgId(null)} style={{ marginTop: 5 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
