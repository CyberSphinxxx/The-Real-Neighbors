import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuthStore } from '../../stores/authStore';
import { getDoc, updateDoc, subscribeToCollection, addDoc } from '../../lib/firestore';
import { formatTimeAgo } from '../../utils/date';
import { X, ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';
import type { User, Comment } from '../../types';
import { getAvatarColor } from '../../utils/avatarColor';
import { orderBy } from 'firebase/firestore';

interface PostDetailModalProps {
  post: any;
  isRedditPost?: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
];

export const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, isRedditPost, onClose, onPrev, onNext }) => {
  const { user } = useAuthStore();
  const [author, setAuthor] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingReaction, setIsUpdatingReaction] = useState(false);
  
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  // Fetch author
  useEffect(() => {
    if (isRedditPost) return;
    let isMounted = true;
    const fetchAuthor = async () => {
      const u = await getDoc<User>('users', [post.authorId]);
      if (isMounted) setAuthor(u);
    };
    fetchAuthor();
    return () => { isMounted = false; };
  }, [post.authorId, isRedditPost]);

  // Real-time comments
  useEffect(() => {
    const collectionPath = isRedditPost ? `redditPosts/${post.id}/comments` : `posts/${post.id}/comments`;
    const unsubscribe = subscribeToCollection<Comment>(
      collectionPath,
      (data) => {
        setComments(data);
        // auto-scroll to bottom on new comments
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      orderBy('createdAt', 'asc')
    );
    return () => unsubscribe();
  }, [post.id]);

  const handleToggleReaction = async (emoji: string) => {
    if (isRedditPost || !user || isUpdatingReaction) return;
    setIsUpdatingReaction(true);
    try {
      const newReactions = { ...post.reactions };
      Object.keys(newReactions).forEach(key => {
        newReactions[key] = newReactions[key].filter((uid: string) => uid !== user.id);
      });
      const hadReaction = post.reactions[emoji]?.includes(user.id);
      if (!hadReaction) {
        if (!newReactions[emoji]) newReactions[emoji] = [];
        newReactions[emoji].push(user.id);
      }
      Object.keys(newReactions).forEach(key => {
        if (newReactions[key].length === 0) delete newReactions[key];
      });
      await updateDoc('posts', [post.id], { reactions: newReactions });
    } catch (error) {
      console.error('Failed to update reaction', error);
    } finally {
      setIsUpdatingReaction(false);
    }
  };

  const handleCommentSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const commentObj = {
        authorId: user.id,
        content: newComment.trim(),
        createdAt: Date.now(),
      };
      const collectionPath = isRedditPost ? `redditPosts/${post.id}/comments` : `posts/${post.id}/comments`;
      await addDoc<Omit<Comment, 'id'>>(collectionPath, commentObj as any);
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasBg = isRedditPost ? false : !!post.bgColor;
  const isImage = isRedditPost 
    ? post.is_reddit_media_domain || !!post.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i)
    : !!post.imageUrl;
  const isYoutube = isRedditPost ? false : !!post.linkMeta?.youtubeId;
  const isRedditVideo = isRedditPost && post.is_video;
  const isPlainText = !isImage && !isYoutube && !hasBg && !isRedditVideo;

  const totalReactionsCount = REACTIONS.reduce((acc, r) => acc + (post.reactions?.[r.emoji]?.length || 0), 0);
  const reactionSummary = REACTIONS.filter(r => (post.reactions?.[r.emoji]?.length || 0) > 0)
    .map(r => `${r.emoji} ${post.reactions?.[r.emoji]?.length}`)
    .join('  ');

  const avatarBg = author ? getAvatarColor(author.displayName) : 'var(--color-primary)';

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative w-full h-full md:max-w-7xl md:h-[90vh] md:rounded-xl overflow-hidden flex flex-col md:flex-row shadow-2xl bg-black animate-in zoom-in-95 duration-200 z-10">
        
        {/* LEFT PANEL */}
        <div 
          className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
          style={{ 
            background: hasBg ? post.bgColor : (isPlainText ? 'var(--color-bg-surface)' : '#000'),
            maxHeight: '100%',
          }}
          onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}
        >
          {isImage && (
            <img 
              src={isRedditPost ? post.url : post.imageUrl!} 
              alt="Post" 
              className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-200"
            />
          )}

          {isRedditVideo && (
            <div className="text-center flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-200">
              <span className="text-6xl mb-4">🎬</span>
              <h3 className="text-white text-2xl font-bold mb-6">Reddit Video</h3>
              <a 
                href={`https://reddit.com${post.permalink}`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors"
              >
                Open on Reddit ↗
              </a>
            </div>
          )}

          {isYoutube && (
            <div className="w-full max-w-4xl p-4 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <div className="w-full relative pt-[56.25%] bg-black rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${post.linkMeta!.youtubeId}?autoplay=0&controls=1&rel=0`}
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="text-white px-2">
                <h3 className="font-semibold text-lg">{post.linkMeta!.title}</h3>
                <p className="text-white/70 text-sm mt-1">{post.linkMeta!.description}</p>
              </div>
            </div>
          )}

          {hasBg && !isImage && !isYoutube && (
            <div className="text-center p-8 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
              <p className="text-white text-3xl md:text-4xl font-heading font-bold max-w-[480px] break-words" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                {post.content}
              </p>
              {post.vibeTag && (
                <div className="mt-6">
                  <span className="px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-sm font-bold tracking-wide flex items-center gap-2">
                    <span>{post.vibeTag.emoji}</span> {post.vibeTag.label}
                  </span>
                </div>
              )}
            </div>
          )}

          {isPlainText && (
            <div className="w-full h-full p-8 flex flex-col justify-center max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
              {isRedditPost ? (
                <>
                  <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noreferrer" className="inline-block w-max px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-6" style={{ background: 'rgba(255, 69, 0, 0.15)', color: '#FF4500', border: '1px solid rgba(255, 69, 0, 0.3)' }}>
                    Reddit ↗
                  </a>
                  <h3 className="font-heading font-bold text-3xl text-main mb-4">{post.title}</h3>
                  {post.selftext && (
                    <p className="text-lg text-muted whitespace-pre-wrap break-words overflow-y-auto max-h-[50vh] custom-scrollbar pr-4">
                      {post.selftext}
                    </p>
                  )}
                  <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noreferrer" className="text-primary text-sm font-medium mt-6 inline-block hover:underline">
                    View original on Reddit ↗
                  </a>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-sm"
                  style={{ background: author?.avatarUrl ? undefined : avatarBg }}
                >
                  {author?.avatarUrl ? (
                    <img src={author.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    author ? author.displayName.charAt(0).toUpperCase() : '?'
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-main text-lg">{author ? author.displayName : 'Loading...'}</h3>
                  <p className="text-muted text-sm">{formatTimeAgo(post.createdAt)}</p>
                </div>
              </div>
              <p className="text-xl md:text-2xl text-main whitespace-pre-wrap break-words leading-relaxed">
                {post.content}
              </p>
              {post.vibeTag && (
                <div className="mt-6">
                  <span 
                    className="px-3 py-1.5 rounded-full text-sm font-bold tracking-wide flex items-center gap-2 w-max"
                    style={{
                      color: post.vibeTag.color,
                      background: `color-mix(in srgb, ${post.vibeTag.color} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${post.vibeTag.color} 30%, transparent)`,
                    }}
                  >
                    <span>{post.vibeTag.emoji}</span> {post.vibeTag.label}
                  </span>
                </div>
              )}
                </>
              )}
            </div>
          )}
          {/* Left Nav Arrow — inside left panel */}
          {onPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all z-20 backdrop-blur-md hidden md:flex items-center justify-center shadow-lg"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {/* Right Nav Arrow — inside left panel on the right edge */}
          {onNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all z-20 backdrop-blur-md hidden md:flex items-center justify-center shadow-lg"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        {/* RIGHT PANEL (Comments) */}
        <div 
          className="w-full md:w-[360px] h-full flex flex-col flex-shrink-0"
          style={{ background: 'var(--color-bg-surface)', borderLeft: '1px solid var(--color-border)' }}
        >
          {/* Right Panel Header: Author row + close button */}
          <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            {isRedditPost ? (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm flex-shrink-0" style={{ background: '#FF4500' }}>🤖</div>
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-main text-sm leading-tight truncate">r/{post.subreddit}</p>
                  <p className="text-faint text-xs truncate">u/{post.author} &middot; {formatTimeAgo(post.created_utc * 1000)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm flex-shrink-0"
                  style={{ background: author?.avatarUrl ? undefined : avatarBg }}
                >
                  {author?.avatarUrl ? (
                    <img src={author.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    author ? author.displayName.charAt(0).toUpperCase() : '?'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-main text-sm leading-tight">{author ? author.displayName : 'Loading...'}</p>
                    {post.vibeTag && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          color: post.vibeTag.color,
                          background: `color-mix(in srgb, ${post.vibeTag.color} 15%, transparent)`,
                        }}
                      >
                        {post.vibeTag.emoji} {post.vibeTag.label}
                      </span>
                    )}
                  </div>
                  <p className="text-faint text-xs">{formatTimeAgo(post.createdAt)}</p>
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-muted hover:text-main transition-colors flex-shrink-0"
              style={{ background: 'var(--color-bg-base)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-elevated)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-base)')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Top Section (post content + reactions) */}
          <div className="p-4 flex-shrink-0 border-b border-border-subtle">
            {isRedditPost ? (
              <>
                <div className="mb-4">
                  <h4 className="font-semibold text-main text-sm mb-1">{post.title}</h4>
                  {post.selftext && (
                     <p className="text-sm text-muted whitespace-pre-wrap break-words line-clamp-4 hover:line-clamp-none cursor-pointer">
                       {post.selftext}
                     </p>
                  )}
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-border-subtle">
                  <div className="flex items-center gap-1.5 text-muted text-xs font-medium" title="Reddit Upvotes">
                    <span>⬆️</span>
                    <span>{post.score > 999 ? (post.score / 1000).toFixed(1) + 'k' : post.score}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted text-xs font-medium" title="Reddit Comments">
                    <span>💬</span>
                    <span>{post.num_comments > 999 ? (post.num_comments / 1000).toFixed(1) + 'k' : post.num_comments}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Author info (visible on mobile only, hidden on md since header shows it) */}
                <div className="flex items-center gap-3 mb-3 md:hidden">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm"
                    style={{ background: author?.avatarUrl ? undefined : avatarBg }}
                  >
                    {author?.avatarUrl ? (
                      <img src={author.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      author ? author.displayName.charAt(0).toUpperCase() : '?'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-main text-sm truncate">{author ? author.displayName : 'Loading...'}</h3>
                      {post.vibeTag && !isPlainText && (
                        <span 
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                          style={{
                            color: post.vibeTag.color,
                            background: `color-mix(in srgb, ${post.vibeTag.color} 15%, transparent)`,
                          }}
                        >
                          {post.vibeTag.emoji} {post.vibeTag.label}
                        </span>
                      )}
                    </div>
                    <p className="text-muted text-xs">{formatTimeAgo(post.createdAt)}</p>
                  </div>
                </div>

                {/* Post Text (if not plain text) */}
                {post.content && !isPlainText && !hasBg && (
                   <p className="text-sm text-main whitespace-pre-wrap break-words mb-4 line-clamp-4 hover:line-clamp-none cursor-pointer">
                     {post.content}
                   </p>
                )}

                {/* Reactions Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 flex-wrap">
                  {REACTIONS.map((r) => {
                    const hasReacted = post.reactions?.[r.emoji]?.includes(user?.id || '');
                    return (
                      <button
                        key={r.emoji}
                        onClick={() => handleToggleReaction(r.emoji)}
                        className="flex items-center gap-1 rounded-full font-medium text-xs transition-transform active:scale-95"
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: hasReacted ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'var(--color-bg-base)',
                          border: hasReacted ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          color: hasReacted ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        }}
                      >
                        <span>{r.emoji}</span>
                      </button>
                    );
                  })}
                </div>
                
                {totalReactionsCount > 0 && (
                  <p className="text-xs text-muted mt-2 font-medium">
                    {reactionSummary}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-muted mb-2 sticky top-0 bg-surface z-10 py-1">
              {isRedditPost ? 'Friends Comments' : 'Comments'}
            </h4>
            {comments.length === 0 ? (
              <p className="text-center text-sm text-faint my-auto">No comments yet. Say something! 💬</p>
            ) : (
              comments.map(comment => (
                <ModalCommentItem key={comment.id} comment={comment} />
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment Input */}
          <div className="p-3 border-t border-border flex items-end gap-2 bg-surface">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm flex-shrink-0 mb-0.5"
              style={{ background: user?.avatarUrl ? undefined : (user ? getAvatarColor(user.displayName) : 'var(--color-primary)') }}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                user?.displayName?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') handleCommentSubmit(); }}
                placeholder="Write a comment..."
                className="w-full bg-elevated border border-default rounded-full pl-4 pr-10 py-2 text-sm text-main placeholder:text-muted focus:border-primary outline-none"
              />
              <button
                onClick={() => handleCommentSubmit()}
                disabled={!newComment.trim() || isSubmitting}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-primary disabled:opacity-50 disabled:text-muted transition-colors hover:bg-primary/10"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};


// Sub-component for individual comments inside the modal
const ModalCommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  const [author, setAuthor] = useState<User | null>(null);
  useEffect(() => {
    let isMounted = true;
    getDoc<User>('users', [comment.authorId]).then(u => {
      if (isMounted) setAuthor(u);
    });
    return () => { isMounted = false; };
  }, [comment.authorId]);

  return (
    <div className="flex gap-2 group">
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow-sm flex-shrink-0 mt-0.5"
        style={{ background: author?.avatarUrl ? undefined : (author ? getAvatarColor(author.displayName) : 'var(--color-primary)') }}
      >
        {author?.avatarUrl ? (
          <img src={author.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
        ) : (
          author ? author.displayName.charAt(0).toUpperCase() : '?'
        )}
      </div>
      <div className="flex-1 min-w-0 bg-base rounded-2xl rounded-tl-sm px-3 py-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-medium text-sm text-main truncate">{author ? author.displayName : 'Loading...'}</span>
          <span className="text-[10px] text-faint flex-shrink-0">&middot; {formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-main whitespace-pre-wrap break-words">{comment.content}</p>
      </div>
    </div>
  );
};
