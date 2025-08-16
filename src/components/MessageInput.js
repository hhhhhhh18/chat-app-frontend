import React, { useState, useEffect } from "react";

export default function MessageInput({ sendMessage, handleTyping, replyTo, clearReply }) {
  const [text, setText] = useState("");

  // Optional: clear input if replyTo changes (e.g., user switches reply target)
  useEffect(() => {
    setText("");
  }, [replyTo]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Pass replyTo id to sendMessage
    sendMessage(text.trim(), replyTo);
    setText("");
    if (clearReply) clearReply(); // clear reply target in parent after sending
  };

  return (
    <form onSubmit={onSubmit} style={{ marginBottom: 10 }}>
      {replyTo && (
        <div style={{ marginBottom: 5, fontStyle: "italic" }}>
          Replying to message ID: {replyTo}{" "}
          <button type="button" onClick={clearReply} style={{ marginLeft: 10 }}>
            Cancel Reply
          </button>
        </div>
      )}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleTyping}
        placeholder="Type a message"
        style={{ width: "80%" }}
      />
      <button type="submit">Send</button>
    </form>
  );
}
