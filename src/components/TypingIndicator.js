export default function TypingIndicator({ typingUser }) {
  return typingUser ? <div>{typingUser} is typing...</div> : null;
}
