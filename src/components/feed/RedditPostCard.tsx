import React, { useState, useEffect } from 'react';
import { MessageSquare, ExternalLink, ArrowUp, Play } from 'lucide-react';
import { subscribeToCollection } from '../../lib/firestore';
import { formatTimeAgo } from '../../utils/date';
import type { RedditPost, Comment } from '../../types';

interface RedditPostCardProps {
  post: RedditPost;
  onOpenPost: (post: RedditPost) => void;
}

export const RedditPostCard: React.FC<RedditPostCardProps> = ({ post, onOpenPost }) => {
  const [ourCommentCount, setOurCommentCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Comment>(
      `redditPosts/${post.id}/comments`,
      (data) => setOurCommentCount(data.length)
    );
    return () => unsubscribe();
  }, [post.id]);

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
          <p className="text-sm text-muted line-clamp-3 whitespace-pre-wrap break-words">
            {post.selftext}
          </p>
        )}
      </div>

      {/* Media */}
      <div className="w-full cursor-pointer" onClick={() => onOpenPost(post)}>
        {isImage && (
          <div className="w-full px-4 pb-3">
            <div className="relative w-full rounded-lg overflow-hidden bg-elevated" style={{ aspectRatio: '16/9' }}>
            <img 
              src={post.url} 
              alt="Post attachment" 
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              style={{ opacity: 0 }}
              onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          </div>
        )}

        {isVideo && (
          <div className="w-full px-4 pb-3">
            <a 
              href={`https://reddit.com${post.permalink}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full pt-[56.25%] bg-black rounded-lg border border-border-subtle overflow-hidden flex items-center justify-center group block"
            >
              {post.thumbnail && post.thumbnail.startsWith('http') && (
                <img src={post.thumbnail} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                  <Play size={24} className="ml-1" />
                </div>
                <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">View on Reddit ↗</span>
              </div>
            </a>
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
    </div>
  );
};
