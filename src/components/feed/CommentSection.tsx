import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { subscribeToCollection, addDoc, getDoc } from '../../lib/firestore';
import { orderBy } from 'firebase/firestore';
import { formatTimeAgo } from '../../utils/date';
import type { Comment, User } from '../../types';
import { Loader2, Send } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  allUsers?: User[];
}

// A sub-component to fetch and render user info for a comment author
const CommentItem: React.FC<{ comment: Comment; allUsers?: User[] }> = ({ comment, allUsers }) => {
  const [author, setAuthor] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAuthor = async () => {
      const u = await getDoc<User>('users', [comment.authorId]);
      if (isMounted) setAuthor(u);
    };
    fetchAuthor();
    return () => { isMounted = false; };
  }, [comment.authorId]);

  return (
    <div className="flex gap-3 text-sm">
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-xs">
        {author ? author.displayName.charAt(0).toUpperCase() : '?'}
      </div>
      <div className="flex-1 bg-surface rounded-2xl rounded-tl-none p-3 border border-border-subtle">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-main">{author ? author.displayName : 'Loading...'}</span>
          <span className="text-xs text-faint">{formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-muted break-words whitespace-pre-wrap">
          {(() => {
            if (!allUsers || !comment.content) return comment.content;
            const tokens = comment.content.split(/(\s+)/);
            return tokens.map((token, i) => {
              if (token.startsWith('@') && token.length > 1) {
                const name = token.slice(1);
                if (allUsers.some(u => u.displayName === name)) {
                  return (
                    <span key={i} className="font-medium cursor-default hover:underline" style={{ color: 'var(--color-primary)' }}>
                      {token}
                    </span>
                  );
                }
              }
              return token;
            });
          })()}
        </p>
      </div>
    </div>
  );
};

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, allUsers }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionCursorPos, setMentionCursorPos] = useState<number | null>(null);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentions, setMentions] = useState<string[]>([]);

  const filteredMentions = React.useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => u.displayName.toLowerCase().startsWith(mentionFilter.toLowerCase()));
  }, [allUsers, mentionFilter]);

  const insertMention = (userToMention: User) => {
    if (mentionCursorPos === null) return;
    const textBeforeMention = content.slice(0, mentionCursorPos - mentionFilter.length - 1);
    const textAfterMention = content.slice(mentionCursorPos);
    const newContent = `${textBeforeMention}@${userToMention.displayName} ${textAfterMention}`;
    setContent(newContent);
    setShowMentionPicker(false);
    setMentions(prev => prev.includes(userToMention.id) ? prev : [...prev, userToMention.id]);
    
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        const newPos = textBeforeMention.length + userToMention.displayName.length + 2;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      setShowMentionPicker(true);
      setMentionFilter(match[1]);
      setMentionCursorPos(cursorPos);
      setMentionSelectedIndex(0);
    } else {
      setShowMentionPicker(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Comment>(
      `posts/${postId}/comments`,
      (data) => {
        setComments(data);
        setIsLoading(false);
      },
      orderBy('createdAt', 'asc')
    );

    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || !user) return;

    const newCommentContent = content.trim();
    const tempId = `temp_${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      authorId: user.id,
      content: newCommentContent,
      createdAt: Date.now(),
    };

    setComments(prev => [...prev, optimisticComment as Comment]);
    setContent('');
    setShowMentionPicker(false);
    
    const savedMentions = [...mentions];
    setMentions([]);

    setIsSubmitting(true);
    try {
      const newComment = {
        authorId: user.id,
        content: newCommentContent,
        createdAt: Date.now(),
      };
      await addDoc<Omit<Comment, 'id'>>(`posts/${postId}/comments`, newComment as any);
      
      // Handle notifications
      import('../../lib/notifications').then(async ({ writeNotification }) => {
        // We need the post to get the authorId
        import('../../lib/firestore').then(async ({ getDoc }) => {
          const post = await getDoc<any>('posts', [postId]);
          if (post && post.authorId !== user.id) {
            writeNotification(post.authorId, {
              type: 'comment',
              fromUid: user.id,
              fromName: user.displayName,
              fromAvatarColor: user.accentColor || '#3b82f6',
              postId,
              message: `${user.displayName} commented on your post`,
              preview: newCommentContent.slice(0, 60),
            }, 'comments');
          }
        });

        savedMentions.forEach(mentionedUid => {
          writeNotification(mentionedUid, {
            type: 'mention',
            fromUid: user.id,
            fromName: user.displayName,
            fromAvatarColor: user.accentColor || '#3b82f6',
            postId,
            message: `${user.displayName} mentioned you in a comment`,
            preview: newCommentContent.slice(0, 60),
          }, 'mentions');
        });
      });

    } catch (error) {
      console.error('Failed to post comment', error);
      setComments(prev => prev.filter(c => c.id !== tempId));
      setContent(newCommentContent); // restore content
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPicker) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionSelectedIndex(prev => Math.min(prev + 1, filteredMentions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredMentions[mentionSelectedIndex]) {
          insertMention(filteredMentions[mentionSelectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionPicker(false);
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="pt-4 border-t border-border-subtle mt-4 animate-in fade-in slide-in-from-top-2">
      <div className="space-y-4 mb-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-muted animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-sm text-faint py-2">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} allUsers={allUsers} />
          ))
        )}
      </div>

      <div className="flex gap-3 items-end">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-xs mb-1">
          {user?.displayName?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 relative">
          {showMentionPicker && filteredMentions.length > 0 && (
            <div 
              className="absolute bottom-full mb-2 left-0 z-50 rounded-xl shadow-lg border max-h-[150px] overflow-y-auto custom-scrollbar"
              style={{
                background: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border-default)',
                minWidth: '200px'
              }}
            >
              {filteredMentions.map((mu, i) => (
                <div 
                  key={mu.id}
                  onClick={() => insertMention(mu)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${i === mentionSelectedIndex ? 'bg-surface' : 'hover:bg-surface'}`}
                  style={{
                    background: i === mentionSelectedIndex ? 'var(--color-bg-surface)' : 'transparent'
                  }}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[9px] shadow-sm flex-shrink-0 bg-primary">
                    {mu.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-main">{mu.displayName}</span>
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            className="w-full bg-base border border-border-subtle rounded-2xl px-4 py-2 text-sm text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary resize-none min-h-[40px] max-h-32"
            rows={content.split('\n').length > 1 ? Math.min(content.split('\n').length, 4) : 1}
          />
        </div>
        <button
          onClick={() => handleSubmit()}
          disabled={!content.trim() || isSubmitting}
          className="mb-1 p-2 rounded-full bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
        </button>
      </div>
    </div>
  );
};
