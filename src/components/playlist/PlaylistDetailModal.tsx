import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuthStore } from '../../stores/authStore';
import { subscribeToCollection, addDoc, getDoc, updateDoc } from '../../lib/firestore';
import { orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
import { formatTimeAgo } from '../../utils/date';
import { X, Send, Loader2, HeadphonesIcon, Music2 } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { StarRating } from '../ui/StarRating';
import { getEmbedUrl } from '../../lib/spotify';
import { getAvatarColor } from '../../utils/avatarColor';
import type { Playlist, User, Comment } from '../../types';

interface PlaylistDetailModalProps {
  playlist: Playlist;
  onClose: () => void;
  initialTab?: 'details' | 'comments';
  allUsers?: User[];
}

const REACTIONS = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '💀', label: 'Skull' },
];

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({ playlist, onClose, initialTab = 'details', allUsers }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingReaction, setIsUpdatingReaction] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'details' | 'comments'>(initialTab);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Real-time comments
  useEffect(() => {
    const unsubscribe = subscribeToCollection<Comment>(
      `playlists/${playlist.id}/comments`,
      (data) => {
        setComments(data);
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      orderBy('createdAt', 'asc')
    );
    return () => unsubscribe();
  }, [playlist.id]);

  const handleToggleReaction = async (emoji: string) => {
    if (!user || isUpdatingReaction) return;
    setIsUpdatingReaction(true);
    try {
      const newReactions = { ...playlist.reactions };
      Object.keys(newReactions).forEach(key => {
        newReactions[key] = (newReactions[key] || []).filter((uid: string) => uid !== user.id);
      });
      const hadReaction = playlist.reactions?.[emoji]?.includes(user.id);
      if (!hadReaction) {
        if (!newReactions[emoji]) newReactions[emoji] = [];
        newReactions[emoji].push(user.id);
      }
      Object.keys(newReactions).forEach(key => {
        if (newReactions[key].length === 0) delete newReactions[key];
      });
      await updateDoc('playlists', [playlist.id], { reactions: newReactions });
    } catch (error) {
      console.error('Failed to update reaction', error);
    } finally {
      setIsUpdatingReaction(false);
    }
  };

  const handleRate = async (star: number) => {
    if (!user) return;
    try {
      await updateDoc('playlists', [playlist.id], {
        [`ratings.${user.id}`]: star
      });
    } catch (error) {
      console.error('Failed to update rating', error);
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
      await addDoc<Omit<Comment, 'id'>>(`playlists/${playlist.id}/comments`, commentObj as any);
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVibing = user ? playlist.nowVibing?.includes(user.id) : false;

  const toggleVibing = () => {
    if (!user) return;
    import('firebase/firestore').then(({ arrayUnion, arrayRemove }) => {
      updateDoc('playlists', [playlist.id], {
        nowVibing: isVibing ? arrayRemove(user.id) : arrayUnion(user.id)
      }).catch(console.error);
    });
  };

  const renderContentWithMentions = (content: string, users?: User[]) => {
    if (!users || !content) return content;
    const tokens = content.split(/(\s+)/);
    return tokens.map((token, i) => {
      if (token.startsWith('@') && token.length > 1) {
        const name = token.slice(1);
        if (users.some(u => u.displayName === name)) {
          return (
            <span key={i} className="font-medium cursor-default hover:underline" style={{ color: 'var(--color-primary)' }}>
              {token}
            </span>
          );
        }
      }
      return token;
    });
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative w-full h-full md:max-w-[1000px] md:h-[90vh] md:rounded-xl overflow-hidden flex flex-col md:flex-row shadow-2xl bg-black animate-in zoom-in-95 duration-200 z-10">
        
        {/* Mobile Tabs */}
        <div className="md:hidden flex w-full bg-surface border-b border-border-subtle flex-shrink-0">
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'details' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'comments' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
            onClick={() => setActiveTab('comments')}
          >
            Comments ({comments.length})
          </button>
          <button onClick={onClose} className="p-3 text-muted">
            <X size={20} />
          </button>
        </div>

        {/* LEFT PANEL */}
        <div 
          className={`w-full md:flex-1 md:w-[55%] flex flex-col bg-black overflow-y-auto custom-scrollbar ${activeTab === 'comments' ? 'hidden md:flex' : 'flex'}`}
        >
          <div className="md:hidden sticky top-0 right-0 p-2 z-10 flex justify-end pointer-events-none">
            {/* We already have close button in mobile tabs */}
          </div>
          
          <button onClick={onClose} className="hidden md:flex absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md">
             <X size={20} />
          </button>

          {/* Top section */}
          <div className="w-full relative">
            <img 
              src={playlist.thumbnailUrl} 
              alt={playlist.title}
              className="w-full h-[220px] object-cover rounded-b-xl md:rounded-xl"
            />
          </div>

          <div className="p-4 md:p-6 text-white flex-1">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-white break-words">{playlist.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-white/70 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zM20.04 9.42c-3.96-2.34-10.44-2.58-14.28-1.44-.6.18-1.2-.12-1.38-.72-.18-.6.12-1.2.72-1.38 4.44-1.26 11.52-1.02 15.96 1.62.539.3.719 1.02.419 1.56-.239.54-.959.72-1.439.36z"/>
              </svg>
              <span>Spotify Playlist</span>
            </div>

            {playlist.description && (
              <p className="mt-3 text-white/80 text-sm whitespace-pre-wrap">{playlist.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                  style={{ background: playlist.addedByAvatarColor }}
                >
                  {playlist.addedByName.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm">
                  <span className="text-white/60">Added by </span>
                  <span className="text-white/90 font-medium">{playlist.addedByName}</span>
                </div>
              </div>
              <span className="text-white/50 text-xs">&middot; {formatTimeAgo(playlist.addedAt)}</span>
              
              {playlist.vibeTag && (
                <span 
                  className="px-2 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 ml-auto"
                  style={{
                    color: '#fff',
                    background: `${playlist.vibeTag.color}dd`,
                    border: `1px solid ${playlist.vibeTag.color}`,
                  }}
                >
                  <span>{playlist.vibeTag.emoji}</span> {playlist.vibeTag.label}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <a 
                href={playlist.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm text-white hover:opacity-90 transition-opacity"
                style={{ background: '#1DB954' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zM20.04 9.42c-3.96-2.34-10.44-2.58-14.28-1.44-.6.18-1.2-.12-1.38-.72-.18-.6.12-1.2.72-1.38 4.44-1.26 11.52-1.02 15.96 1.62.539.3.719 1.02.419 1.56-.239.54-.959.72-1.439.36z"/>
                </svg>
                Open in Spotify
              </a>

              <button
                onClick={toggleVibing}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all border ${isVibing ? 'bg-success/15 border-success text-success' : 'border-white/30 text-white hover:bg-white/10'}`}
              >
                {isVibing ? (
                  <>
                    <HeadphonesIcon size={18} className="fill-success" />
                    Vibing ✓
                  </>
                ) : (
                  <>
                    <HeadphonesIcon size={18} />
                    Start Vibing
                  </>
                )}
              </button>
            </div>

            {/* Vibing Members */}
            {playlist.nowVibing && playlist.nowVibing.length > 0 && (
              <div className="flex items-center gap-2 mt-4 text-white/70 text-xs">
                <span>Vibing:</span>
                <div className="flex -space-x-1.5">
                  {playlist.nowVibing.slice(0, 4).map((uid, idx) => {
                    const member = allUsers?.find(u => u.id === uid);
                    return (
                      <div 
                        key={uid}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-black shadow-sm"
                        style={{ background: member?.avatarUrl ? undefined : (member?.accentColor || '#3b82f6'), zIndex: 10 - idx }}
                        title={member?.displayName || 'Someone'}
                      >
                        {member?.avatarUrl ? (
                          <img src={member.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          member?.displayName.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                    );
                  })}
                  {playlist.nowVibing.length > 4 && (
                    <div className="w-5 h-5 rounded-full bg-white/20 border border-black flex items-center justify-center text-[8px] font-bold text-white z-0">
                      +{playlist.nowVibing.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reactions & Rating Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {REACTIONS.map((r) => {
                  const count = playlist.reactions?.[r.emoji]?.length || 0;
                  const hasReacted = playlist.reactions?.[r.emoji]?.includes(user?.id || '');

                  return (
                    <button
                      key={r.emoji}
                      onClick={() => handleToggleReaction(r.emoji)}
                      className="flex items-center gap-1.5 rounded-full font-medium text-sm transition-all"
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: hasReacted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                        border: hasReacted ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                      }}
                    >
                      <span>{r.emoji}</span>
                      {count > 0 && <span className="text-white/80">{count}</span>}
                    </button>
                  );
                })}
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10 w-max">
                <StarRating 
                  ratings={playlist.ratings || {}} 
                  currentUid={user?.id || ''} 
                  onRate={handleRate} 
                  size="md" 
                />
              </div>
            </div>

            {/* Spotify Embed Player */}
            <div className="mt-8 rounded-xl overflow-hidden shadow-xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <iframe
                src={getEmbedUrl(playlist.spotifyId)}
                width="100%"
                height="380"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
            <p className="text-center text-white/50 text-xs mt-2 mb-6">Playback requires Spotify app</p>
          </div>
        </div>

        {/* RIGHT PANEL (Comments) */}
        <div 
          className={`w-full md:w-[45%] h-full flex flex-col flex-shrink-0 bg-surface md:border-l md:border-border-subtle ${activeTab === 'details' ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle flex-shrink-0 bg-surface z-10">
            <h3 className="font-semibold text-sm text-main flex items-center gap-2">
              💬 Comments
            </h3>
            <button
              onClick={onClose}
              className="hidden md:flex p-1.5 rounded-full text-muted hover:text-main hover:bg-elevated transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted">
                <Music2 size={32} className="mb-3 opacity-50" />
                <p className="text-sm">No comments yet.</p>
                <p className="text-sm">What do you think of this playlist? 🎵</p>
              </div>
            ) : (
              comments.map(comment => (
                <ModalCommentItem key={comment.id} comment={comment} allUsers={allUsers} />
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment Input */}
          <div className="p-3 border-t border-border-subtle flex items-end gap-2 bg-surface">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm flex-shrink-0 mb-0.5"
              style={{ background: user?.avatarUrl ? undefined : (user ? getAvatarColor(user.displayName) : 'var(--color-primary)') }}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" />
              ) : (
                user?.displayName?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
                placeholder="Write a comment..."
                className="w-full bg-elevated border border-border-subtle rounded-full pl-4 pr-10 py-2 text-sm text-main placeholder:text-muted focus:border-primary outline-none transition-colors"
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
const ModalCommentItem: React.FC<{ comment: Comment; allUsers?: User[] }> = ({ comment, allUsers }) => {
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
          <img src={author.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" />
        ) : (
          author ? author.displayName.charAt(0).toUpperCase() : '?'
        )}
      </div>
      <div className="flex-1 min-w-0 bg-base rounded-2xl rounded-tl-sm px-3 py-2 border border-border-subtle">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-medium text-sm text-main truncate">{author ? author.displayName : 'Loading...'}</span>
          <span className="text-[10px] text-faint flex-shrink-0">&middot; {formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-main whitespace-pre-wrap break-words">
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
