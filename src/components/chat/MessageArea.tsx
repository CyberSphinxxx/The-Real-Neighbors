import React, { useEffect, useState, useRef } from 'react';
import { Hash, Circle } from 'lucide-react';
import { subscribeToMessages, subscribeToTypingStatus, updateDMSeenReceipt } from '../../lib/chat';
import { subscribeToCollection } from '../../lib/firestore';
import { useAuthStore } from '../../stores/authStore';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { getAvatarColor } from '../../utils/avatarColor';
import { ChatInput } from './ChatInput';
import { MessageItem } from './MessageItem';
import type { Channel, ChatMessage, DirectMessage, User } from '../../types';

interface MessageAreaProps {
  threadType: 'channels' | 'dms';
  threadId: string;
  channel?: Channel;
  dm?: DirectMessage;
}

export const MessageArea: React.FC<MessageAreaProps> = ({ threadType, threadId, channel, dm }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, any>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const { onlineUsers } = useOnlineUsers();

  useEffect(() => {
    if (threadType === 'dms' && dm && user) {
      const otherUserId = dm.participants.find(id => id !== user.id);
      if (!otherUserId) return;
      const unsub = subscribeToCollection<User>('users', (data) => {
        const other = data.find(u => u.id === otherUserId);
        setOtherUser(other || null);
      });
      return () => unsub();
    }
  }, [threadType, dm, user]);

  const isOtherUserOnline = otherUser && onlineUsers.some(u => u.uid === otherUser.id);

  // Update Seen Receipt
  useEffect(() => {
    if (threadType === 'dms' && user && document.hasFocus()) {
      updateDMSeenReceipt(threadId, user.id);
    }
  }, [threadId, threadType, user, messages]);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages(threadId, 100, (data) => {
      setMessages(data);
    }, threadType);
    return () => unsubscribe();
  }, [threadId, threadType]);

  // Subscribe to typing status
  useEffect(() => {
    const unsubscribe = subscribeToTypingStatus(threadId, (data) => {
      setTypingUsers(data);
    });
    return () => unsubscribe();
  }, [threadId]);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current && isScrolledToBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isScrolledToBottom]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setIsScrolledToBottom(isBottom);
  };

  // Process messages for grouping and separators
  const processMessages = () => {
    const processed: React.ReactNode[] = [];
    let lastDate = '';
    let lastAuthorId = '';
    let lastTimestamp = 0;
    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const dateStr = msgDate.toLocaleDateString();
      
      // Date Separator
      if (dateStr !== lastDate) {
        let displayDate = dateStr;
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
        
        if (dateStr === today) displayDate = 'Today';
        else if (dateStr === yesterday) displayDate = 'Yesterday';
        else displayDate = msgDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

        processed.push(
          <div key={`date-${dateStr}`} className="flex items-center justify-center my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative bg-base px-4 py-1 rounded-full border border-border-subtle text-xs font-semibold text-faint">
              {displayDate}
            </div>
          </div>
        );
        
        lastDate = dateStr;
        lastAuthorId = ''; // Reset grouping across dates
      }

      // Find the ID of the last message sent by the current user
      let lastSentMessageId = '';
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].authorId === user?.id) {
          lastSentMessageId = messages[i].id;
          break;
        }
      }

      // Grouping logic (same author, within 5 minutes)
      const isGrouped = msg.authorId === lastAuthorId && (msg.createdAt - lastTimestamp) < 5 * 60 * 1000 && msg.type !== 'system';

      let seenByAvatar = null;
      if (threadType === 'dms' && dm && otherUser && msg.id === lastSentMessageId && msg.authorId === user?.id) {
        const otherUserSeenAt = dm.seenBy?.[otherUser.id] || 0;
        if (otherUserSeenAt >= msg.createdAt) {
          seenByAvatar = (
            <div className="absolute right-4 -bottom-2 w-4 h-4 rounded-full overflow-hidden border border-surface bg-surface shadow-sm z-10" title={`Seen by ${otherUser.displayName}`}>
              {otherUser.avatarUrl ? (
                <img src={otherUser.avatarUrl} alt="Seen" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-white text-[8px]" style={{ background: getAvatarColor(otherUser.displayName) }}>
                  {otherUser.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        }
      }

      processed.push(
        <MessageItem 
          key={msg.id} 
          message={msg} 
          threadId={threadId}
          threadType={threadType}
          isGrouped={isGrouped} 
          onReply={() => setReplyingTo(msg)}
          seenByAvatar={seenByAvatar}
        />
      );

      lastAuthorId = msg.authorId;
      lastTimestamp = msg.createdAt;
    });

    return processed;
  };

  const activeTypers = Object.entries(typingUsers)
    .filter(([_, data]) => data.isTyping)
    .map(([uid]) => uid); // In a real app we'd map UID to names, but we only have userIds in RTDB without names right now. 
    // Ideally RTDB would store {isTyping: true, name: 'Alice'} or we join it. 
    // Let's just say "Someone is typing" or if 1 person "A user is typing".

  const renderTypingIndicator = () => {
    if (activeTypers.length === 0) return null;
    return (
      <div className="absolute bottom-full left-4 mb-2 text-xs text-faint flex items-center gap-2 bg-base px-2 py-1 rounded">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </span>
        {activeTypers.length === 1 ? 'Someone is typing...' : 'Several people are typing...'}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-base">
      {/* Header */}
      <div className="h-14 border-b border-border-subtle flex items-center px-6 shadow-sm z-10 flex-shrink-0 bg-surface">
        {threadType === 'channels' && channel ? (
          <>
            <span className="text-xl mr-2">{channel.emoji || <Hash size={20} className="text-muted" />}</span>
            <h2 className="font-semibold text-main text-lg">{channel.name}</h2>
            {channel.description && (
              <>
                <div className="w-px h-5 bg-border-subtle mx-4" />
                <span className="text-sm text-muted truncate">{channel.description}</span>
              </>
            )}
          </>
        ) : threadType === 'dms' && otherUser ? (
          <>
            <div className="relative mr-3 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-white text-sm" style={{ background: otherUser.avatarUrl ? undefined : getAvatarColor(otherUser.displayName) }}>
              {otherUser.avatarUrl ? <img src={otherUser.avatarUrl} alt="" className="w-full h-full object-cover" /> : otherUser.displayName.charAt(0).toUpperCase()}
              {isOtherUserOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full z-10" style={{ background: 'var(--color-success)', border: '2px solid var(--color-bg-surface)' }} />}
            </div>
            <h2 className="font-semibold text-main text-lg">{otherUser.displayName}</h2>
            {isOtherUserOnline && <span className="text-xs text-faint ml-3 flex items-center gap-1"><Circle size={8} fill="var(--color-success)" stroke="none" /> Online</span>}
          </>
        ) : (
          <h2 className="font-semibold text-main text-lg">Chat</h2>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col"
      >
        {/* Welcome message */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-end mb-8 pl-4">
            {threadType === 'channels' && channel ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-elevated flex items-center justify-center text-4xl mb-4">
                  {channel.emoji || <Hash size={32} className="text-muted" />}
                </div>
                <h1 className="text-3xl font-bold text-main mb-2">Welcome to {channel.name}!</h1>
                <p className="text-muted">This is the start of the {channel.name} channel.</p>
              </>
            ) : threadType === 'dms' && otherUser ? (
              <>
                <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center font-bold text-white text-3xl mb-4" style={{ background: otherUser.avatarUrl ? undefined : getAvatarColor(otherUser.displayName) }}>
                  {otherUser.avatarUrl ? <img src={otherUser.avatarUrl} alt="" className="w-full h-full object-cover" /> : otherUser.displayName.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-3xl font-bold text-main mb-2">Chat with {otherUser.displayName}</h1>
                <p className="text-muted">This is the start of your direct message history.</p>
              </>
            ) : null}
          </div>
        ) : (
          <div className="min-h-full flex flex-col justify-end">
            <div className="pb-4">
              {processMessages()}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative mt-auto">
        {renderTypingIndicator()}
        <ChatInput 
          threadId={threadId}
          threadType={threadType}
          placeholderName={threadType === 'channels' ? channel?.name : otherUser?.displayName}
          replyingTo={replyingTo} 
          onCancelReply={() => setReplyingTo(null)} 
        />
      </div>
    </div>
  );
};
