import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { sendMessage, setTypingStatus } from '../../lib/chat';
import type { ChatMessage } from '../../types';

interface ChatInputProps {
  threadId: string;
  threadType: 'channels' | 'dms';
  placeholderName?: string;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ threadId, threadType, placeholderName, replyingTo, onCancelReply }) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    if (!user) return;

    // Trigger typing indicator
    setTypingStatus(threadId, user.id, true);

    // Clear timeout if exists
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(threadId, user.id, false);
    }, 2000);
  };

  const isImageUrl = (url: string) => {
    return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!user || !content.trim()) return;

    const messageText = content.trim();
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Clear typing status immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingStatus(threadId, user.id, false);

    const isImage = isImageUrl(messageText);

    try {
      await sendMessage(threadId, {
        content: isImage ? '' : messageText,
        authorId: user.id,
        authorName: user.displayName,
        authorAvatarColor: user.accentColor || '#3B82F6', // fallback
        type: isImage ? 'image' : 'text',
        ...(isImage && { imageUrl: messageText }),
        ...(replyingTo && {
          replyTo: {
            messageId: replyingTo.id,
            authorName: replyingTo.authorName,
            contentPreview: replyingTo.type === 'image' ? '🖼️ Image' : replyingTo.content.substring(0, 50)
          }
        })
      }, threadType);
      if (onCancelReply) onCancelReply();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could add toast here
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 bg-base flex flex-col gap-2">
      {replyingTo && (
        <div className="flex items-center justify-between bg-surface border border-border-subtle rounded-t-lg px-4 py-2 mx-2 -mb-4 z-0 text-sm">
          <div className="flex items-center gap-2 text-faint">
            <span className="font-medium text-main">Replying to @{replyingTo.authorName}</span>
            <span className="truncate max-w-xs">{replyingTo.type === 'image' ? 'Image' : replyingTo.content}</span>
          </div>
          <button onClick={onCancelReply} className="text-muted hover:text-main">
            <X size={16} />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="z-10 relative">
        <div className="relative flex items-end bg-surface border border-border-subtle rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${placeholderName || '...'}`}
          className="w-full bg-transparent text-main placeholder-faint resize-none outline-none py-3 px-4 max-h-[120px] custom-scrollbar"
          rows={1}
        />
        <div className="flex items-center p-2 flex-shrink-0">
          <button
            type="submit"
            disabled={!content.trim()}
            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        </div>
      </form>
    </div>
  );
};
