/**
 * Message list component
 * Displays messages with virtualization for performance
 */

import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppStore } from '../../stores/useAppStore';
import { Message } from './Message';

export function MessageList() {
  const channel = useAppStore((s) => s.getActiveChannelData());
  const messages = channel?.messages || [];
  const parentRef = useRef<HTMLDivElement>(null);
  const scrolledToBottomRef = useRef(true);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28, // Estimated row height
    overscan: 10,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrolledToBottomRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
      });
    }
  }, [messages.length, virtualizer]);

  // Track if user is at bottom
  const handleScroll = () => {
    if (!parentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    scrolledToBottomRef.current = isAtBottom;
  };

  if (messages.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#AAA' }}>
        No messages yet
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Message message={message} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
