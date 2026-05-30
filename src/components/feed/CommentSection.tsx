import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { subscribeToCollection, addDoc, getDoc } from '../../lib/firestore';
import { orderBy } from 'firebase/firestore';
import { formatTimeAgo } from '../../utils/date';
import type { Comment, User } from '../../types';
import { Loader2, Send } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
}

// A sub-component to fetch and render user info for a comment author
const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
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
        <p className="text-muted break-words whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
};

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

    setIsSubmitting(true);
    try {
      const newComment = {
        authorId: user.id,
        content: content.trim(),
        createdAt: Date.now(),
      };
      await addDoc<Omit<Comment, 'id'>>(`posts/${postId}/comments`, newComment as any);
      setContent('');
    } catch (error) {
      console.error('Failed to post comment', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>

      <div className="flex gap-3 items-end">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-xs mb-1">
          {user?.displayName?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
