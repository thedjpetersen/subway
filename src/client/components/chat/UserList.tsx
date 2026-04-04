/**
 * User list component
 * Shows users in the current channel - styled to match original Subway
 */

import { useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import type { IrcUser } from '@shared/types/irc.types';

// Sort users by mode (ops first, then voiced, then regular)
function sortUsers(users: IrcUser[]): IrcUser[] {
  const getModeWeight = (user: IrcUser): number => {
    if (user.type === '@') return 0; // Op
    if (user.type === '+') return 1; // Voice
    return 2; // Regular
  };

  return [...users].sort((a, b) => {
    const weightDiff = getModeWeight(a) - getModeWeight(b);
    if (weightDiff !== 0) return weightDiff;
    // Sort alphabetically within same mode
    return a.nick.localeCompare(b.nick);
  });
}

export function UserList() {
  const channel = useAppStore((s) => s.getActiveChannelData());
  const activeChannel = useAppStore((s) => s.activeChannel);

  const sortedUsers = useMemo(() => {
    return sortUsers(channel?.users || []);
  }, [channel?.users]);

  // Don't show for status or non-channel views
  if (!activeChannel?.startsWith('#') || !channel) {
    return null;
  }

  return (
    <div className="userList">
      {/* Header */}
      <div className="titlebar">
        Users ({sortedUsers.length})
      </div>

      {/* User list */}
      <div className="usersListed">
        {sortedUsers.map((user) => {
          const isOp = user.type === '@';
          const isVoice = user.type === '+';

          return (
            <div key={user.nick} className="user">
              {isOp && (
                <span className="activeUser">@</span>
              )}
              {isVoice && (
                <span className="notActiveUser">+</span>
              )}
              {!isOp && !isVoice && (
                <span className="notActiveUser" style={{ visibility: 'hidden' }}>.</span>
              )}
              {user.nick}
            </div>
          );
        })}
      </div>
    </div>
  );
}
