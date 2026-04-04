/**
 * Side navigation component
 * Shows servers and channels - styled to match original Subway design
 */

import { useAppStore } from '../../stores/useAppStore';

export function SideNav() {
  const {
    connections,
    activeServer,
    activeChannel,
    setActiveServer,
    setActiveChannel,
    showMainMenu,
    setShowMainMenu,
  } = useAppStore();

  return (
    <nav>
      {/* Header with logo */}
      <div className="text-center" onClick={() => setShowMainMenu(true)}>
        <div style={{
          width: 80,
          height: 80,
          margin: '0 auto',
          background: '#315857',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 36,
          color: 'white',
          fontWeight: 'bold'
        }}>
          S
        </div>
        <h1>
          Subway
          <small> IRC</small>
        </h1>
      </div>

      {/* Server and channel list */}
      <div className="nav-area">
        {Object.entries(connections).map(([serverName, server]) => (
          <div key={serverName}>
            {/* Server header */}
            <div
              className="server_name nav_server_name pointer"
              onClick={() => {
                setActiveServer(serverName);
                setActiveChannel('status');
              }}
            >
              <span>{serverName}</span>
            </div>

            {/* Nick display */}
            <div className="server_nick">
              {server.nick}
            </div>

            {/* Channels */}
            <ul>
              {Object.entries(server.channels).map(([channelName, channel]) => (
                <li
                  key={channelName}
                  onClick={() => {
                    setActiveServer(serverName);
                    setActiveChannel(channelName);
                  }}
                  className={activeServer === serverName && activeChannel === channelName ? 'active' : ''}
                >
                  <span>
                    {channelName === 'status' ? 'Status' : channelName}
                  </span>
                  {channel.unread > 0 && (
                    <span className={Object.keys(channel.highlights || {}).length > 0 ? 'unread_highlight' : 'unread'}>
                      {channel.unread}
                    </span>
                  )}
                  <i className="icon-remove" title="Close"></i>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
