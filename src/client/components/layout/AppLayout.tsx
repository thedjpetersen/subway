/**
 * Main application layout
 * Contains sidebar, chat area, and user list - styled to match original Subway
 */

import { SideNav } from './SideNav';
import { Chat } from '../chat/Chat';

export function AppLayout() {
  return (
    <div className="app">
      {/* Sidebar navigation */}
      <SideNav />

      {/* Main content area */}
      <main>
        <Chat />
      </main>
    </div>
  );
}
