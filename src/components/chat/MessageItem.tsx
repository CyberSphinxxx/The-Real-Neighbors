import React, { useState, useEffect } from 'react';
import { Reply, Smile, Edit2, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { deleteMessage, addReaction } from '../../lib/chat';
import { getAvatarColor } from '../../utils/avatarColor';
import type { ChatMessage } from '../../types';

interface MessageItemProps {
  message: ChatMessage;
  threadId: string;
  threadType: 'channels' | 'dms';
  isGrouped: boolean;
  onReply: () => void;
  seenByAvatar?: React.ReactNode;
  authorAvatarUrl?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, threadId, threadType, isGrouped, onReply, seenByAvatar, authorAvatarUrl }) => {
  const { user } = useAuthStore();
  const [showActions, setShowActions] = useState(false);
  const [optimisticReactions, setOptimisticReactions] = useState(message.reactions || {});
  const isAuthor = user?.id === message.authorId;

  useEffect(() => {
    setOptimisticReactions(message.reactions || {});
  }, [message.reactions]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(threadId, message.id, threadType);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const handleQuickReact = async (emoji: string) => {
    if (!user) return;
    setShowActions(false);

    const prevReactions = { ...optimisticReactions };
    const newReactions = { ...optimisticReactions };

    let hadReaction = false;
    Object.keys(newReactions).forEach(key => {
      if (key === emoji && newReactions[key].includes(user.id)) {
        hadReaction = true;
      }
      newReactions[key] = newReactions[key].filter(uid => uid !== user.id);
    });

    if (!hadReaction) {
      if (!newReactions[emoji]) newReactions[emoji] = [];
      newReactions[emoji].push(user.id);
    }

    Object.keys(newReactions).forEach(key => {
      if (newReactions[key].length === 0) delete newReactions[key];
    });

    setOptimisticReactions(newReactions);

    try {
      await addReaction(threadId, message.id, emoji, user.id, message.reactions || {}, threadType);
    } catch (error) {
      console.error('Failed to add reaction', error);
      setOptimisticReactions(prevReactions);
    }
  };

  return (
    <div 
      className={`group flex gap-4 px-4 py-0.5 hover:bg-elevated/50 transition-colors relative ${isGrouped ? 'mt-0' : 'mt-4'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Left Gutter: Avatar or Time */}
      <div className="w-10 flex-shrink-0 flex justify-center pt-0.5 select-none">
        {!isGrouped ? (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: authorAvatarUrl ? undefined : (message.authorAvatarColor || getAvatarColor(message.authorName)) }}
          >
            {authorAvatarUrl ? (
              <img src={authorAvatarUrl} alt={message.authorName} className="w-full h-full object-cover" />
            ) : (
              message.authorName.charAt(0).toUpperCase()
            )}
          </div>
        ) : (
          <span className="text-[10px] text-faint opacity-0 group-hover:opacity-100 transition-opacity mt-1 cursor-default">
            {formatTime(message.createdAt)}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-medium text-main hover:underline cursor-pointer">
              {message.authorName}
            </span>
            <span className="text-xs text-faint cursor-default">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        {/* Reply Context */}
        {message.replyTo && !isGrouped && (
          <div className="flex items-center gap-2 text-sm text-faint mb-1 ml-1 cursor-pointer hover:text-main transition-colors">
            <div className="w-6 h-4 border-l-2 border-t-2 border-border-subtle rounded-tl-lg -ml-7 -mt-2 opacity-50" />
            <div className="w-4 h-4 rounded-full bg-surface flex items-center justify-center text-[10px] font-bold text-main">
              {message.replyTo.authorName.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">@{message.replyTo.authorName}</span>
            <span className="truncate max-w-[200px] opacity-80">{message.replyTo.contentPreview}</span>
          </div>
        )}

        {/* Message Content */}
        <div className="text-main break-words">
          {message.isDeleted ? (
            <span className="text-faint italic flex items-center gap-2">
              <Trash2 size={14} /> This message was deleted.
            </span>
          ) : message.type === 'image' ? (
            <div className="mt-2 mb-1 max-w-sm rounded-lg overflow-hidden border border-border-subtle">
              <img src={message.imageUrl} alt="Message attachment" className="w-full h-auto object-cover" loading="lazy" />
            </div>
          ) : message.type === 'system' ? (
            <span className="text-faint italic">{message.content}</span>
          ) : (
            <span className="whitespace-pre-wrap">
              {message.content}
              {message.isEdited && <span className="text-[10px] text-faint ml-2">(edited)</span>}
            </span>
          )}
        </div>

        {/* Reactions */}
        {Object.keys(optimisticReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(optimisticReactions).map(([emoji, users]) => (
              <button 
                key={emoji}
                className={`px-1.5 py-0.5 rounded text-xs flex items-center gap-1 border ${users.includes(user?.id || '') ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface border-border-subtle text-muted hover:bg-elevated'}`}
              >
                <span>{emoji}</span>
                <span className="font-medium">{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Seen Receipt Avatar */}
      {seenByAvatar}

      {/* Hover Actions */}
      {!message.isDeleted && showActions && (
        <div className="absolute right-4 -top-3 bg-surface border border-border-subtle rounded-md shadow-sm flex items-center p-0.5 z-10 animate-in fade-in duration-150 group/actions">
          <div className="relative flex items-center group/react">
            <button className="p-1.5 text-muted hover:text-main hover:bg-elevated rounded transition-colors" title="React">
              <Smile size={16} />
            </button>
            <div className="absolute top-full right-0 mt-1 hidden group-hover/react:flex items-center gap-1 bg-surface border border-border-subtle rounded-lg shadow-lg p-1">
              {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleQuickReact(emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-elevated rounded text-lg transition-transform hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={onReply}
            className="p-1.5 text-muted hover:text-main hover:bg-elevated rounded transition-colors" 
            title="Reply"
          >
            <Reply size={16} />
          </button>
          {isAuthor && (
            <>
              <button className="p-1.5 text-muted hover:text-main hover:bg-elevated rounded transition-colors" title="Edit">
                <Edit2 size={16} />
              </button>
              <button 
                onClick={handleDelete}
                className="p-1.5 text-red-500 hover:text-red-400 hover:bg-elevated rounded transition-colors" 
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
