// src/components/Toast.js
import React from 'react';

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="chat-toast">{message}</div>
  );
}
