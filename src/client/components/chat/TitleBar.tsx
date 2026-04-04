/**
 * Title bar component
 * Shows channel name and topic - styled to match original Subway
 */

import { useAppStore } from '../../stores/useAppStore';

export function TitleBar() {
  const activeChannel = useAppStore((s) => s.activeChannel);
  const channel = useAppStore((s) => s.getActiveChannelData());

  return (
    <div className="titlebar">
      <strong>
        {activeChannel === 'status' ? 'Server Status' : activeChannel}
      </strong>
      <span>
        {channel?.topic || ''}
      </span>
      {activeChannel?.startsWith('#') && channel && (
        <span style={{ textAlign: 'right' }}>
          {channel.users.length} users
        </span>
      )}
    </div>
  );
}
