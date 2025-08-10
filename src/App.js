import React, { useState } from 'react';
import Chat from './components/Chat';
import ActiveUsers from './components/ActiveUsers';

function App() {
  const [username, setUsername] = useState('');
  const [logged, setLogged] = useState(false);

  return (
    <div>
      {!logged ? (
        <div
          className="login-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '10px',
            backgroundColor: '#f0f0f0',
          }}
        >
          <h2>Enter Username</h2>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Your username"
            style={{ padding: '8px', fontSize: 16, width: 200 }}
          />
          <button
            onClick={() => setLogged(true)}
            disabled={!username.trim()}
            style={{
              padding: '8px 16px',
              fontSize: 16,
              cursor: username.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Join Chat
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'flex-start',
            height: '100vh',
            width: '100vw',
            backgroundColor: '#f9f9f9',
            gap: '20px',
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <ActiveUsers username={username} />
          <Chat username={username} />
        </div>
      )}
    </div>
  );
}

export default App;
