import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getDoc, updateDoc } from '../../lib/firestore';
import { formatTimeAgo } from '../../utils/date';
import { CommentSection } from './CommentSection';
import type { Post, User } from '../../types';
import { MessageCircle, Pin } from 'lucide-react';

interface PostCardProps {
  post: Post;
  commentCount: number; // passed down if we know it, otherwise just use a default or fetch
}

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Lol' },
  { emoji: '😮', label: 'Grabe' },
  { emoji: '💀', label: 'Patay' },
  { emoji: '🔥', label: 'Fire' },
];

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuthStore();
  const [author, setAuthor] = useState<User | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isUpdatingReaction, setIsUpdatingReaction] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAuthor = async () => {
      const u = await getDoc<User>('users', [post.authorId]);
      if (isMounted) setAuthor(u);
    };
    fetchAuthor();
    return () => { isMounted = false; };
  }, [post.authorId]);

  const isAdmin = user?.role === 'admin';

  const handleTogglePin = async () => {
    if (!isAdmin) return;
    
    try {
      if (!post.isPinned) {
        // If we are pinning this post, we must unpin any currently pinned posts first
        // We can query for them since we only want one pinned post
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        const q = query(collection(db, 'posts'), where('isPinned', '==', true));
        const snapshot = await getDocs(q);
        
        // Unpin all currently pinned posts
        const unpinPromises = snapshot.docs.map(docSnap => 
          updateDoc('posts', [docSnap.id], { isPinned: false })
        );
        await Promise.all(unpinPromises);
      }

      // Now toggle this post's pin status
      await updateDoc('posts', [post.id], { isPinned: !post.isPinned });
    } catch (error) {
      console.error("Failed to toggle pin", error);
    }
  };

  const handleToggleReaction = async (emoji: string) => {
    if (!user || isUpdatingReaction) return;
    setIsUpdatingReaction(true);
    
    try {
      const newReactions = { ...post.reactions };
      
      // Remove user from all current reactions to ensure only 1 reaction per user
      Object.keys(newReactions).forEach(key => {
        newReactions[key] = newReactions[key].filter(uid => uid !== user.id);
      });

      // If they clicked a reaction they didn't already have selected, add it
      const hadReaction = post.reactions[emoji]?.includes(user.id);
      if (!hadReaction) {
        if (!newReactions[emoji]) newReactions[emoji] = [];
        newReactions[emoji].push(user.id);
      }

      // Cleanup empty arrays
      Object.keys(newReactions).forEach(key => {
        if (newReactions[key].length === 0) delete newReactions[key];
      });

      await updateDoc('posts', [post.id], { reactions: newReactions });
    } catch (error) {
      console.error("Failed to update reaction", error);
    } finally {
      setIsUpdatingReaction(false);
    }
  };

  return (
    <div className={`bg-surface rounded-2xl p-5 shadow-sm border ${post.isPinned ? 'border-primary shadow-primary/10' : 'border-border-subtle'} hover:shadow-md transition-shadow mb-6`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            {author ? author.displayName.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h3 className="font-semibold text-main text-sm">{author ? author.displayName : 'Loading...'}</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted">{formatTimeAgo(post.createdAt)}</p>
              {post.isPinned && (
                <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  <Pin size={10} /> Pinned
                </span>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleTogglePin}
            className={`p-2 rounded-full transition-colors ${post.isPinned ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted hover:bg-base'}`}
            title={post.isPinned ? "Unpin post" : "Pin post"}
          >
            <Pin size={16} />
          </button>
        )}
      </div>

      {/* Body */}
      <p className="text-main mb-4 whitespace-pre-wrap break-words">{post.content}</p>

      {/* Link Preview */}
      {post.linkMeta && (
        <a 
          href={post.linkMeta.url}
          target="_blank"
          rel="noopener noreferrer" 
          className="block mb-4 border border-border-subtle rounded-xl overflow-hidden bg-base hover:border-border transition-colors group"
        >
          {post.linkMeta.image && (
            <div className="w-full h-48 overflow-hidden bg-border-subtle">
              <img src={post.linkMeta.image} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          )}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-main truncate group-hover:text-primary transition-colors">{post.linkMeta.title}</h4>
            <p className="text-xs text-muted line-clamp-2 mt-1">{post.linkMeta.description}</p>
            <p className="text-[10px] text-faint mt-2 uppercase tracking-wide truncate">{new URL(post.linkMeta.url).hostname}</p>
          </div>
        </a>
      )}

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
          {REACTIONS.map((r) => {
            const count = post.reactions?.[r.emoji]?.length || 0;
            const hasReacted = post.reactions?.[r.emoji]?.includes(user?.id || '');
            
            return (
              <button
                key={r.emoji}
                onClick={() => handleToggleReaction(r.emoji)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  hasReacted 
                    ? 'bg-primary/15 text-primary border border-primary/20' 
                    : 'bg-base text-muted hover:bg-surface border border-border-subtle hover:border-border'
                }`}
                title={r.label}
              >
                <span>{r.emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ml-2 ${
            showComments ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-base'
          }`}
        >
          <MessageCircle size={16} />
          <span className="hidden sm:inline">Comments</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection postId={post.id} />
      )}
    </div>
  );
};
