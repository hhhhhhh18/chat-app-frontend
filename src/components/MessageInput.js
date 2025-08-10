import React, { useState } from 'react';

export default function MessageInput({ sendMessage, handleTyping }) {
  const [text, setText] = useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (text) sendMessage(text);
        setText('');
      }}
      style={{ marginBottom: 10 }}
    >
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyPress={handleTyping}
        placeholder="Type a message"
        style={{ width: '80%' }}
      />
      <button type="submit">Send</button>
    </form>
  );
}
