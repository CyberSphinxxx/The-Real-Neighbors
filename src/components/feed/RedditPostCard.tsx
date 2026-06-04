import React, { useState, useEffect } from 'react';
import { MessageSquare, ExternalLink, ArrowUp, Share2 } from 'lucide-react';
import { subscribeToCollection, addDoc } from '../../lib/firestore';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { formatTimeAgo } from '../../utils/date';
import type { RedditPost, Comment, Post } from '../../types';
import { ShareRedditPostModal } from './ShareRedditPostModal';

interface RedditPostCardProps {
  post: RedditPost;
  onOpenPost: (post: RedditPost) => void;
}

export const RedditPostCard: React.FC<RedditPostCardProps> = ({ post, onOpenPost }) => {
  const { user } = useAuthStore();
  const [ourCommentCount, setOurCommentCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Comment>(
      `redditPosts/${post.id}/comments`,
      (data) => setOurCommentCount(data.length)
    );
    return () => unsubscribe();
  }, [post.id]);

  const handleShareSubmit = async (caption: string) => {
    if (!user || isSharing) return;
    setIsSharing(true);
    try {
      const newPost: Omit<Post, 'id'> = {
        authorId: user.id,
        content: caption || '',
        createdAt: Date.now(),
        isPinned: false,
        reactions: {},
        comments: [],
        sharedRedditPost: post,
      };
      await addDoc('posts', newPost as any);
      toast.success('Shared to feed!');
      setShowShareModal(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to share to feed.');
    } finally {
      setIsSharing(false);
    }
  };

  const isImage = post.is_reddit_media_domain || post.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  const isVideo = post.is_video;
  const isLink = !isImage && !isVideo && post.url && !post.url.includes('reddit.com/r/');

  return (
    <div className="bg-surface rounded-xl border border-border-subtle shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 pb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0" style={{ background: '#FF4500' }}>
            🤖
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-main text-sm truncate">r/{post.subreddit}</h3>
            <p className="text-muted text-xs truncate">
              Posted by u/{post.author} &middot; {formatTimeAgo(post.created_utc * 1000)}
            </p>
          </div>
        </div>
        <a 
          href={`https://reddit.com${post.permalink}`} 
          target="_blank" 
          rel="noreferrer"
          className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors hover:opacity-80"
          style={{ background: 'rgba(255, 69, 0, 0.15)', color: '#FF4500', border: '1px solid rgba(255, 69, 0, 0.3)' }}
        >
          Reddit <ExternalLink size={10} />
        </a>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 cursor-pointer" onClick={() => onOpenPost(post)}>
        <h2 className="text-base font-semibold text-main mb-1.5 leading-snug">{post.title}</h2>
        {post.selftext && (
          <p className="text-sm text-muted whitespace-pre-wrap break-words">
            {post.selftext}
          </p>
        )}
      </div>

      {/* Media */}
      <div className="w-full cursor-pointer" onClick={() => onOpenPost(post)}>
        {isImage && (
          <div className="w-full px-4 pb-3">
            <div className="w-full rounded-lg overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/5">
            <img 
              src={post.url} 
              alt="Post attachment" 
              loading="lazy"
              decoding="async"
              className="w-full h-auto max-h-[700px] object-contain transition-opacity duration-300"
              style={{ opacity: 0 }}
              onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          </div>
        )}

        {isVideo && (
          <div className="w-full px-4 pb-3" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full bg-black rounded-lg border border-border-subtle overflow-hidden" style={{ paddingTop: '100%' }}>
              <iframe
                src={`https://www.redditmedia.com/mediaembed/${post.id.replace('t3_', '')}`}
                sandbox="allow-scripts allow-same-origin allow-popups"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                scrolling="no"
                allowFullScreen
                title="Reddit Video Player"
              />
            </div>
          </div>
        )}

        {isLink && (
          <div className="w-full px-4 pb-3">
            <a 
              href={post.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-elevated transition-colors"
            >
              {post.thumbnail && post.thumbnail.startsWith('http') && (
                <img src={post.thumbnail} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-main truncate">{post.title}</p>
                <p className="text-xs text-muted truncate mt-0.5">{new URL(post.url).hostname}</p>
              </div>
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4 text-muted text-xs font-medium">
          <div className="flex items-center gap-1.5" title="Reddit Upvotes">
            <ArrowUp size={14} />
            <span>{post.score > 999 ? (post.score / 1000).toFixed(1) + 'k' : post.score}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Reddit Comments">
            <MessageSquare size={14} />
            <span>{post.num_comments > 999 ? (post.num_comments / 1000).toFixed(1) + 'k' : post.num_comments}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}
            disabled={isSharing}
            className="px-3 py-1.5 hover:bg-elevated text-primary rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 size={14} />
            Share
          </button>
          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
            <MessageSquare size={14} />
            <span>{ourCommentCount} Friends</span>
          </div>
          <button 
            onClick={() => onOpenPost(post)}
            className="px-3 py-1.5 bg-elevated hover:bg-border border border-border-subtle rounded-full text-xs font-semibold text-main transition-colors"
          >
            View Post
          </button>
        </div>
      </div>

      {showShareModal && (
        <ShareRedditPostModal
          post={post}
          onClose={() => setShowShareModal(false)}
          onShare={handleShareSubmit}
        />
      )}
    </div>
  );
};

