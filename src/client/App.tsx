import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { useSocket } from './hooks/useSocket';
import { AppLayout } from './components/layout/AppLayout';
import { MainMenu } from './components/menu/MainMenu';

function App() {
  const { showMainMenu, activeServer, setShowMainMenu } = useAppStore();
  const { isConnected } = useSocket();

  // Hide main menu when we have an active server
  useEffect(() => {
    if (activeServer && showMainMenu) {
      // Keep menu shown until manually closed or connection established
    }
  }, [activeServer, showMainMenu]);

  return (
    <div className="container">
      {/* Main app layout with nav sidebar */}
      <AppLayout />

      {/* Main menu overlay */}
      {showMainMenu && <MainMenu />}

      {/* Connection status indicator */}
      {!isConnected && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: '#FA6900',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 5,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          Connecting...
        </div>
      )}
    </div>
  );
}

export default App;
