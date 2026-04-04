/**
 * Main menu component
 * Styled to match original Subway design with dark sidebar
 */

import { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useUserStore } from '../../stores/useUserStore';
import { useAppStore } from '../../stores/useAppStore';

type Tab = 'connect' | 'login' | 'register' | 'settings';

export function MainMenu() {
  const [activeTab, setActiveTab] = useState<Tab>('connect');
  const { isLoggedIn, username } = useUserStore();
  const { setShowMainMenu, connections } = useAppStore();
  const hasConnections = Object.keys(connections).length > 0;

  const handleClose = () => {
    if (hasConnections) {
      setShowMainMenu(false);
    }
  };

  return (
    <div className="mainMenu">
      <div className="menuContainer">
        {/* Dark sidebar menu */}
        <ul className="menuList">
          <li
            onClick={() => setActiveTab('connect')}
            className={activeTab === 'connect' ? 'activeMenuItem' : ''}
          >
            <span className="icon">+</span>
            Connect
          </li>
          {!isLoggedIn && (
            <>
              <li
                onClick={() => setActiveTab('login')}
                className={activeTab === 'login' ? 'activeMenuItem' : ''}
              >
                <span className="icon">&#x2192;</span>
                Login
              </li>
              <li
                onClick={() => setActiveTab('register')}
                className={activeTab === 'register' ? 'activeMenuItem' : ''}
              >
                <span className="icon">&#x2605;</span>
                Register
              </li>
            </>
          )}
          <li
            onClick={() => setActiveTab('settings')}
            className={activeTab === 'settings' ? 'activeMenuItem' : ''}
          >
            <span className="icon">&#x2699;</span>
            Settings
          </li>
          {hasConnections && (
            <li onClick={handleClose}>
              <span className="icon">&#x2715;</span>
              Close Menu
            </li>
          )}
        </ul>

        {/* Content area */}
        <div className="menuArea">
          {isLoggedIn && (
            <div className="alert" style={{ background: '#8A9B0F', color: 'white', marginBottom: 20 }}>
              <p>Logged in as <strong>{username}</strong></p>
            </div>
          )}

          {activeTab === 'connect' && <ConnectForm />}
          {activeTab === 'login' && !isLoggedIn && <LoginForm onSuccess={() => setActiveTab('connect')} />}
          {activeTab === 'register' && !isLoggedIn && <RegisterForm onSuccess={() => setActiveTab('login')} />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}

function ConnectForm() {
  const [server, setServer] = useState('irc.libera.chat');
  const [nick, setNick] = useState('');
  const [channel, setChannel] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [port, setPort] = useState('6667');
  const [ssl, setSsl] = useState(false);
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectIrc } = useSocket();
  const { setShowMainMenu } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!server || !nick) return;

    setIsConnecting(true);
    connectIrc({
      server,
      nick,
      channels: channel ? [channel] : [],
      port: parseInt(port, 10),
      secure: ssl,
      password: password || undefined,
    });

    // Hide menu after connecting
    setTimeout(() => {
      setShowMainMenu(false);
      setIsConnecting(false);
    }, 500);
  };

  return (
    <div>
      <h1>Connect to IRC</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={server}
          onChange={(e) => setServer(e.target.value)}
          placeholder="Server (e.g., irc.libera.chat)"
          className="fullWidth"
          required
        />
        <input
          type="text"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="Nickname"
          className="fullWidth"
          required
        />
        <input
          type="text"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          placeholder="Channel (e.g., #test)"
          className="fullWidth"
        />

        <div className="moreOptions">
          <input
            type="checkbox"
            id="showMore"
            checked={showMore}
            onChange={(e) => setShowMore(e.target.checked)}
          />
          <label htmlFor="showMore">Show more options</label>
        </div>

        {showMore && (
          <div style={{ marginTop: 10 }}>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="Port (default: 6667)"
              className="fullWidth"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Server Password (optional)"
              className="fullWidth"
            />
            <div className="moreOptions">
              <input
                type="checkbox"
                id="ssl"
                checked={ssl}
                onChange={(e) => setSsl(e.target.checked)}
              />
              <label htmlFor="ssl">Use SSL</label>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isConnecting}
          className="button"
          style={{ marginTop: 15 }}
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      </form>

      <ActiveConnections />
    </div>
  );
}

function ActiveConnections() {
  const { connections, setActiveServer, setActiveChannel, setShowMainMenu } = useAppStore();
  const serverList = Object.keys(connections);

  if (serverList.length === 0) return null;

  const handleSelect = (server: string) => {
    setActiveServer(server);
    setActiveChannel('status');
    setShowMainMenu(false);
  };

  return (
    <div className="activeConnections">
      <h3>Active Connections</h3>
      {serverList.map((server) => (
        <div key={server} style={{ marginBottom: 10 }}>
          <strong>{server}</strong>
          <span className="badge" style={{ marginLeft: 10 }}>
            {connections[server].nick}
          </span>
          <i
            className="pointer"
            onClick={() => handleSelect(server)}
            style={{ marginLeft: 10, opacity: 0.6 }}
            title="Switch to this connection"
          >
            &#x2192;
          </i>
        </div>
      ))}
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useUserStore();
  const { getSocketId } = useSocket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username,
          password,
          socketid: getSocketId() || '',
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setUser(data.username);
        onSuccess();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <p style={{ marginBottom: 20, color: '#666' }}>
        Login to save your connections and settings across sessions.
      </p>

      {error && (
        <div className="alert error">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="fullWidth"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="fullWidth"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="button"
          style={{ marginTop: 15 }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useSocket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    register(username, password);

    // Listen for success
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 1500);
  };

  return (
    <div>
      <h1>Register</h1>
      <p style={{ marginBottom: 20, color: '#666' }}>
        Create an account to save your connections and settings.
      </p>

      {error && (
        <div className="alert error">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="fullWidth"
          required
          minLength={3}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="fullWidth"
          required
          minLength={6}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="fullWidth"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="button"
          style={{ marginTop: 15 }}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div>
      <h1>Settings</h1>

      <ul className="navBar">
        <li className="navActive">General</li>
        <li>Highlights</li>
        <li>Plugins</li>
      </ul>

      <div>
        <p style={{ color: '#666' }}>
          Settings panel coming soon. Here you can configure:
        </p>
        <ul style={{ marginTop: 10, marginLeft: 20, color: '#666' }}>
          <li>Highlight words</li>
          <li>Notification preferences</li>
          <li>Display options</li>
          <li>Plugins</li>
        </ul>
      </div>
    </div>
  );
}
