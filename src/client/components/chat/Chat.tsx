/**
 * Chat component
 * Contains the message list, title bar, message input, and user list
 * Styled to match original Subway design
 */

import { useAppStore } from '../../stores/useAppStore';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TitleBar } from './TitleBar';
import { UserList } from './UserList';

export function Chat() {
  const activeChannel = useAppStore((s) => s.getActiveChannelData());
  const activeServer = useAppStore((s) => s.activeServer);
  const currentChannel = useAppStore((s) => s.activeChannel);

  if (!activeServer) {
    return (
      <div className="loading">
        <h2>Welcome to Subway</h2>
        <p>Select a server to get started</p>
      </div>
    );
  }

  const showUserList = currentChannel?.startsWith('#');

  return (
    <div className="chat">
      {/* Title bar */}
      <TitleBar />

      {/* Main chat area with messages and user list */}
      <div className="chatContent">
        {/* Message list */}
        <div className="messages">
          <MessageList />
        </div>

        {/* User list (only for channels) */}
        {showUserList && <UserList />}
      </div>

      {/* Message input */}
      <MessageInput />
    </div>
  );
}
