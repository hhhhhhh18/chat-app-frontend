import React from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export default function EmojiPicker({ onSelect }) {
  const handleEmojiSelect = (emoji) => {
    onSelect(emoji.native); // send emoji character back
  };

  return (
    <Picker
      data={data}
      onEmojiSelect={handleEmojiSelect}
      set="native"
      style={{ position: 'relative', zIndex: 100 }}
    />
  );
}
