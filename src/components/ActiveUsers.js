import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

export default function ActiveUsers({ username }) {
  const [activeUsers, setActiveUsers] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io('http://localhost:3001', { query: { username } });

    socketRef.current.on('activeUsers', (users) => {
      setActiveUsers(users);
    });

    return () => socketRef.current.disconnect();
  }, [username]);

  return (
    <div style={{
      width: 150,
      border: '1px solid #ccc',
      padding: 10,
      borderRadius: 4,
      height: '80vh',
      overflowY: 'auto',
      backgroundColor: '#fff'
    }}>
      <h4>Active Users</h4>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {activeUsers.map((user, idx) => (
          <li key={user + idx} style={{ marginBottom: 6 }}>
            {user}
          </li>
        ))}
      </ul>
    </div>
  );
}
