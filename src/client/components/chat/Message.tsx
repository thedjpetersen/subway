/**
 * Message component
 * Renders individual IRC messages - styled to match original Subway
 */

import { useMemo } from 'react';
import type { Message as MessageType } from '@shared/types/irc.types';

interface MessageProps {
  message: MessageType;
  isHighlighted?: boolean;
}

// Format timestamp
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Parse URLs in text
function parseLinks(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#0B2666' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function Message({ message, isHighlighted }: MessageProps) {
  const timestamp = useMemo(
    () => formatTime(new Date(message.timestamp)),
    [message.timestamp]
  );

  // Determine CSS classes
  const getMessageClass = () => {
    const classes = ['message'];
    if (message.type === 'ACTION') classes.push('isMe');
    if (isHighlighted) classes.push('mention');
    if (message.type === 'SERVER' || message.type === 'MOTD') classes.push('motd');
    return classes.join(' ');
  };

  // Render based on message type
  switch (message.type) {
    case 'PRIVMSG':
      return (
        <div className={getMessageClass()}>
          <div className="messageAuthor">{message.from}</div>
          <div className="messageText">{parseLinks(message.text || '')}</div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    case 'ACTION':
      return (
        <div className={getMessageClass()}>
          <div className="messageAuthor">*</div>
          <div className="messageText">
            <strong>{message.from}</strong> {message.text}
          </div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    case 'JOIN':
      return (
        <div className="message">
          <div className="messageAuthor" style={{ color: '#8A9B0F' }}>--&gt;</div>
          <div className="messageText" style={{ color: '#8A9B0F' }}>
            {message.from} has joined
          </div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    case 'PART':
      return (
        <div className="message">
          <div className="messageAuthor" style={{ color: '#FA6900' }}>&lt;--</div>
          <div className="messageText" style={{ color: '#FA6900' }}>
            {message.from} has left{message.text && ` (${message.text})`}
          </div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    case 'QUIT':
      return (
        <div className="message">
          <div className="messageAuthor" style={{ color: '#980000' }}>&lt;--</div>
          <div className="messageText" style={{ color: '#980000' }}>
            {message.from} has quit{message.text && ` (${message.text})`}
          </div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    case 'KICK':
      return (
        <div className="message">
          <div className="messageAuthor" style={{ color: '#980000' }}>!</div>
          <div className="messageText" style={{ color: '#980000' }}>
            {String(message.attributes?.kicked || 'Someone')} was kicked by {message.from}
            {message.text && ` (${message.text})`}
          </div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    case 'NICK':
      return (
        <div className="message">
          <div className="messageAuthor" style={{ color: '#666' }}>--</div>
          <div className="messageText" style={{ color: '#666' }}>
            {message.from} is now known as {message.text}
          </div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    case 'MODE':
      return (
        <div className="message">
          <div className="messageAuthor" style={{ color: '#666' }}>*</div>
          <div className="messageText" style={{ color: '#666' }}>
            {message.from} sets mode {message.text}
          </div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    case 'TOPIC':
      return (
        <div className="message">
          <div className="messageAuthor" style={{ color: '#315857' }}>*</div>
          <div className="messageText" style={{ color: '#315857' }}>
            {message.from} changed the topic to: {message.text}
          </div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    case 'NOTICE':
      return (
        <div className="message">
          <div className="messageAuthor" style={{ color: '#666' }}>-{message.from}-</div>
          <div className="messageText" style={{ color: '#666' }}>{message.text}</div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    case 'SERVER':
    case 'MOTD':
      return (
        <div className="message motd">
          <div className="messageAuthor" style={{ color: '#999' }}>*</div>
          <div className="messageText">{message.text}</div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    case 'ERROR':
      return (
        <div className="message" style={{ background: '#FFECEC' }}>
          <div className="messageAuthor" style={{ color: '#980000' }}>!</div>
          <div className="messageText" style={{ color: '#980000' }}>
            Error: {message.text}
          </div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );

    default:
      return (
        <div className="message">
          <div className="messageAuthor">{message.from || '*'}</div>
          <div className="messageText">
            [{message.type}] {message.text}
          </div>
          <div className="messageTimestamp">{timestamp}</div>
        </div>
      );
  }
}
