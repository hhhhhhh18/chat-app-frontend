import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Message from "./Message";
import TypingIndicator from "./TypingIndicator";
import EmojiPicker from "./EmojiPicker";
import Toast from "./Toast";

// Auto-pick backend URL (dev -> localhost, prod -> Render)
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://chat-app-backend-7-80sh.onrender.com");

export default function Chat({ username }) {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const [reactionPickerForMsgId, setReactionPickerForMsgId] = useState(null);
  const [typingUser, setTypingUser] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [notification, setNotification] = useState("");
  const [replyingToMsgId, setReplyingToMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // For de-duping system messages that sometimes arrive twice in dev
  const seenSystemIdsRef = useRef(new Set());
  const lastSystemRef = useRef({ text: "", ts: 0 });

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      query: { username },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = socket;

    const handleIncomingMessage = (msg) => {
      setMessages((m) => {
        const existing = m.find((x) => x.id === msg.id);
        if (existing) {
          return m.map((x) =>
            x.id === msg.id ? { ...x, status: msg.status } : x
          );
        }
        return [...m, msg];
      });

      if (msg.user !== username) {
        socket.emit("messageReceived", {
          msgId: msg.id,
          senderSocketId: msg.senderSocketId,
        });
        socket.emit("readMessage", {
          msgId: msg.id,
          senderSocketId: msg.senderSocketId,
        });
      }
    };

    socket.on("message", handleIncomingMessage);
    socket.on("fileMessage", handleIncomingMessage);

    socket.on("systemMessage", (msg) => {
      const now = Date.now();
      if (msg?.id && seenSystemIdsRef.current.has(msg.id)) return;
      if (
        msg?.text &&
        msg.text === lastSystemRef.current.text &&
        now - lastSystemRef.current.ts < 1500
      ) {
        return;
      }
      if (msg?.id) seenSystemIdsRef.current.add(msg.id);
      lastSystemRef.current = { text: msg?.text || "", ts: now };
      setMessages((m) => [...m, { ...msg, system: true }]);
    });

    socket.on("messageStatusUpdate", ({ msgId, status }) => {
      setMessages((m) =>
        m.map((msg) => (msg.id === msgId ? { ...msg, status } : msg))
      );
    });

    socket.on("activeUsers", setActiveUsers);

    socket.on("typing", (user) => {
      setTypingUser(user);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(""), 4000);
    });

    socket.on("stopTyping", () => {
      setTypingUser("");
      clearTimeout(typingTimeoutRef.current);
    });

    socket.on("reactUpdate", ({ msgId, emoji }) => {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === msgId
            ? { ...msg, reactions: [...(msg.reactions || []), emoji] }
            : msg
        )
      );
    });

    const showNotification = (msg) => {
      setNotification(msg);
      setTimeout(() => setNotification(""), 2200);
    };
    socket.on("userJoined", showNotification);
    socket.on("userLeft", showNotification);

    return () => {
      socket.disconnect();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChange = (e) => setMessageInput(e.target.value);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (messageInput.trim()) {
        sendMessage(messageInput, replyingToMsgId);
      }
    }
  };

  const sendMessage = (text, replyTo) => {
    if (!text.trim()) return;
    const socket = socketRef.current;
    if (!socket) return;

    const message = {
      id: Date.now(),
      text,
      user: username,
      replyTo: replyTo || null,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        username
      )}&background=random`,
      senderSocketId: socket.id,
      status: "sent",
      timestamp: Date.now(),
    };

    socket.emit("sendMessage", message);
    setMessageInput("");
    setShowInputEmojiPicker(false);
    socket.emit("stopTyping", username);
    setReplyingToMsgId(null);
  };

  const sendFile = () => {
    if (!selectedFile) return;
    const socket = socketRef.current;
    if (!socket) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      const fileMessage = {
        id: Date.now(),
        user: username,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          username
        )}&background=random`,
        senderSocketId: socket.id,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        data: base64Data,
        status: "sent",
        timestamp: Date.now(),
      };
      socket.emit("sendFile", fileMessage);
      setSelectedFile(null);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleTyping = () => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("typing", username);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", username);
    }, 3000);
  };

  const reactToMsg = (msgId, emoji) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("reactMessage", msgId, emoji);
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

  const replyingMessageText = replyingToMsgId
    ? messages.find((m) => m.id === replyingToMsgId)?.text || ""
    : null;

  return (
    <div
      style={{
        width: 500,
        border: "1px solid #ccc",
        padding: 10,
        margin: "auto",
        background: "#fafaff",
        borderRadius: 13,
      }}
    >
      <Toast message={notification} />
      <div className="active-users-container">
        <h4>Active Users</h4>
        <ul>
          {activeUsers.map((user, i) => (
            <li key={user + i}>{user}</li>
          ))}
        </ul>
      </div>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Active Users ({activeUsers.length}): {activeUsers.join(", ")}
      </div>
      <TypingIndicator typingUser={typingUser} />
      <div className="input-container">
        {replyingToMsgId && (
          <div
            style={{
              backgroundColor: "#e2e8f0",
              padding: 8,
              marginBottom: 6,
              borderRadius: 6,
              fontSize: 14,
              color: "#444",
              position: "relative",
            }}
          >
            Replying to: {replyingMessageText}
            <button
              onClick={() => setReplyingToMsgId(null)}
              style={{
                position: "absolute",
                right: 8,
                top: 8,
                background: "transparent",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        )}
        <textarea
          className="chat-input"
          placeholder="Type your message..."
          rows={2}
          value={messageInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onInput={handleTyping}
        />
        <button
          className="emoji-picker-btn"
          onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
        >
          😀
        </button>
        <button
          className="send-btn"
          onClick={() => sendMessage(messageInput, replyingToMsgId)}
          disabled={!messageInput.trim()}
        >
          ➤
        </button>
      </div>
      {showInputEmojiPicker && (
        <EmojiPicker onSelect={handleInputEmojiSelect} />
      )}
      <div style={{ marginBottom: 12 }}>
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button
          onClick={sendFile}
          disabled={!selectedFile}
          style={{ marginLeft: 8 }}
        >
          Send File
        </button>
      </div>
      <div>
        {messages.map((msg) => (
          <Message
            key={msg.id}
            msg={{
              ...msg,
              reply: msg.replyTo
                ? messages.find((m) => m.id === msg.replyTo)?.text || ""
                : null,
            }}
            onReactClick={() => setReactionPickerForMsgId(msg.id)}
            onReply={setReplyingToMsgId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      {reactionPickerForMsgId && (
        <div
          style={{ position: "fixed", bottom: 100, left: 50, zIndex: 100 }}
        >
          <EmojiPicker onSelect={handleReactEmojiSelect} />
          <button
            onClick={() => setReactionPickerForMsgId(null)}
            style={{ marginTop: 5 }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
