/**
 * Message input component
 * Handles message composition and IRC command sending
 * Styled to match original Subway
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAppStore } from '../../stores/useAppStore';

export function MessageInput() {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { say, sendCommand, sendRaw } = useSocket();
  const activeServer = useAppStore((s) => s.activeServer);
  const activeChannel = useAppStore((s) => s.activeChannel);

  // Focus input on mount and channel change
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeChannel]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const trimmed = message.trim();
      if (!trimmed || !activeServer) return;

      // Add to history
      setHistory((prev) => {
        const newHistory = [trimmed, ...prev.slice(0, 49)];
        return newHistory;
      });
      setHistoryIndex(-1);

      // Handle commands
      if (trimmed.startsWith('/')) {
        const parts = trimmed.slice(1).split(' ');
        const command = parts[0].toUpperCase();
        const args = parts.slice(1);

        switch (command) {
          case 'ME':
            // Action message
            if (activeChannel && activeChannel !== 'status') {
              sendRaw(`PRIVMSG ${activeChannel} :\x01ACTION ${args.join(' ')}\x01`);
            }
            break;

          case 'MSG':
          case 'PRIVMSG':
            // Private message
            if (args.length >= 2) {
              const target = args[0];
              const text = args.slice(1).join(' ');
              say(target, text);
            }
            break;

          case 'JOIN':
            if (args[0]) {
              sendCommand('join', args[0]);
            }
            break;

          case 'PART':
            if (args[0]) {
              sendCommand('part', args[0]);
            } else if (activeChannel && activeChannel !== 'status') {
              sendCommand('part', activeChannel);
            }
            break;

          case 'NICK':
            if (args[0]) {
              sendCommand('nick', args[0]);
            }
            break;

          case 'TOPIC':
            if (activeChannel && activeChannel !== 'status') {
              sendCommand('topic', `${activeChannel} ${args.join(' ')}`);
            }
            break;

          case 'KICK':
            if (activeChannel && args[0]) {
              const reason = args.slice(1).join(' ') || 'Kicked';
              sendCommand('kick', `${activeChannel} ${args[0]} ${reason}`);
            }
            break;

          case 'MODE':
            if (args.length > 0) {
              const target = args[0].startsWith('#')
                ? args[0]
                : activeChannel !== 'status'
                  ? activeChannel
                  : null;
              if (target) {
                sendCommand('mode', `${target} ${args.slice(1).join(' ')}`);
              }
            }
            break;

          case 'WHOIS':
            if (args[0]) {
              sendCommand('whois', args[0]);
            }
            break;

          case 'QUERY':
            // Open private message window
            if (args[0]) {
              sendCommand('query', args[0]);
            }
            break;

          case 'QUIT':
            sendCommand('quit', args.join(' ') || 'Leaving');
            break;

          case 'RAW':
          case 'QUOTE':
            // Send raw IRC command
            sendRaw(args.join(' '));
            break;

          case 'CLEAR':
            // Clear messages - would need to implement in store
            break;

          default:
            // Unknown command, send as raw
            sendRaw(trimmed.slice(1));
        }
      } else {
        // Regular message
        if (activeChannel && activeChannel !== 'status') {
          say(activeChannel, trimmed);
        }
      }

      setMessage('');
    },
    [message, activeServer, activeChannel, say, sendCommand, sendRaw]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // History navigation
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length > 0 && historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setMessage(history[newIndex]);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setMessage(history[newIndex]);
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setMessage('');
        }
      }

      // Tab completion (basic nick completion)
      if (e.key === 'Tab') {
        e.preventDefault();
        // TODO: Implement nick tab completion
      }
    },
    [history, historyIndex]
  );

  const isDisabled = !activeChannel || activeChannel === 'status';

  return (
    <div className="messageInput">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flex: 1 }}>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isDisabled
              ? 'Select a channel to chat...'
              : 'Type a message or /command...'
          }
          disabled={isDisabled}
          autoComplete="off"
          spellCheck="true"
          style={{ flex: 1, marginRight: 10 }}
        />
        <button
          type="submit"
          disabled={isDisabled || !message.trim()}
          className="button"
        >
          Send
        </button>
      </form>
    </div>
  );
}
