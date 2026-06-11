import React, { useState, useEffect } from 'react';
import type { WatchlistEntry, WatchlistReview, User } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { addDoc, subscribeToCollection, deleteDoc } from '../../lib/firestore';
import { X, Star, Send, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { MobileBottomSheet } from '../ui/MobileBottomSheet';

interface Props {
  entry: WatchlistEntry;
  users: User[];
  onClose: () => void;
}

export const MediaDetailModal: React.FC<Props> = ({ entry, users, onClose }) => {
  const { user } = useAuthStore();
  const { entries } = useWatchlistStore();
  const [reviews, setReviews] = useState<WatchlistReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  
  // Review Form State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Fetch reviews for this specific entry ID
  useEffect(() => {
    const unsub = subscribeToCollection<WatchlistReview>(
      `watchlists/${entry.id}/reviews`,
      (data) => {
        // Sort by createdAt descending
        const sorted = data.sort((a, b) => b.createdAt - a.createdAt);
        setReviews(sorted);
        setIsLoadingReviews(false);
      }
    );
    return () => unsub();
  }, [entry.id]);

  // Find other neighbors tracking this item (based on title and type)
  const trackedBy = entries.filter(e => 
    e.title.toLowerCase().trim() === entry.title.toLowerCase().trim() &&
    (e.type || 'movie') === (entry.type || 'movie')
  );

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const reviewPayload: Partial<WatchlistReview> = {
        authorId: user.id,
        authorName: user.displayName,
        authorAvatarColor: user.accentColor || 'var(--color-primary)',
        comment: comment.trim(),
        createdAt: Date.now(),
      };
      
      if (rating > 0) {
        reviewPayload.rating = rating;
      }

      await addDoc(`watchlists/${entry.id}/reviews`, reviewPayload as unknown as Record<string, unknown>);
      setComment('');
      setRating(0);
      toast.success('Review posted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to post review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteDoc(`watchlists/${entry.id}/reviews`, reviewId);
      toast.success('Review deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete review');
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const modalContent = (
    <div className="flex flex-col md:flex-row h-full w-full bg-surface">
        {/* Left Column: Media Details */}
        <div className="w-full md:w-5/12 bg-base border-b md:border-b-0 md:border-r border-border-subtle overflow-y-auto custom-scrollbar flex flex-col">
          {/* Header Image */}
          <div className="relative aspect-[2/3] w-full shrink-0 bg-elevated">
            {entry.coverUrl ? (
              <img 
                src={entry.coverUrl} 
                alt={entry.title} 
                className="w-full h-full object-cover"
              />
            ) : entry.backdropUrl ? (
              <img 
                src={entry.backdropUrl} 
                alt={entry.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted">
                <span className="text-6xl font-black opacity-20">{entry.title.charAt(0)}</span>
              </div>
            )}
            
            <button 
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors md:hidden"
            >
              <X size={20} />
            </button>
            
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent h-32 pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex gap-2 text-xs font-bold uppercase tracking-wider mb-2">
                <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur text-white">
                  {entry.type === 'movie' ? '🎬 Movie' : entry.type === 'tv' ? '📺 TV' : '🎌 Anime'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-black leading-tight drop-shadow-md">
                {entry.title}
              </h2>
            </div>
          </div>

          {/* Metadata */}
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-main">
              {entry.year && (
                <div>{entry.year}</div>
              )}
              {entry.episodes && (
                <div>{entry.episodes} eps</div>
              )}
              {entry.externalScore && (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Star size={16} className="fill-amber-500" />
                  <span>{entry.externalScore}/10</span>
                </div>
              )}
            </div>
            
            {entry.genres && entry.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {entry.genres.map(g => (
                  <span key={g} className="px-2 py-1 bg-elevated border border-border-subtle rounded text-xs font-medium text-muted">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {entry.overview && (
              <div className="text-sm text-muted leading-relaxed">
                {entry.overview}
              </div>
            )}

            {/* Tracked By Section */}
            {trackedBy.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                  Neighbors Tracking This
                </h3>
                <div className="flex flex-wrap gap-3">
                  {trackedBy.map(t => {
                    const trackingUser = users.find(u => u.id === t.userId);
                    if (!trackingUser) return null;
                    return (
                      <div key={t.id} className="flex flex-col items-center gap-1" title={`${trackingUser.displayName} (${t.status})`}>
                        {trackingUser.avatarUrl ? (
                          <img src={trackingUser.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-surface shadow-sm" />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-surface shadow-sm"
                            style={{ backgroundColor: trackingUser.accentColor || 'var(--color-primary)' }}
                          >
                            {trackingUser.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[10px] font-medium text-main line-clamp-1 max-w-[50px] text-center">
                          {trackingUser.displayName.split(' ')[0]}
                        </span>
                        <div className={`w-2 h-2 rounded-full mt-0.5 ${
                          t.status === 'watching' ? 'bg-primary' : 
                          t.status === 'finished' ? 'bg-success' : 'bg-muted'
                        }`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reviews */}
        <div className="w-full md:w-7/12 flex flex-col h-[50vh] md:h-auto bg-surface">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border-subtle bg-surface shrink-0">
            <h3 className="font-heading font-bold text-lg text-main flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" /> 
              Neighbor Reviews
            </h3>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-main transition-colors hidden md:block"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 flex flex-col gap-4">
            {isLoadingReviews ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
                <MessageSquare size={32} className="mb-3 opacity-20" />
                <p className="text-sm">No reviews yet.</p>
                <p className="text-xs">Be the first to leave your thoughts!</p>
              </div>
            ) : (
              reviews.map(review => {
                const authorUser = users.find(u => u.id === review.authorId);
                const isAuthor = user?.id === review.authorId;
                
                return (
                  <div key={review.id} className="flex gap-3 bg-base p-4 rounded-xl border border-border-subtle">
                    {/* Avatar */}
                    <div className="shrink-0">
                      {authorUser?.avatarUrl ? (
                        <img src={authorUser.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: authorUser?.accentColor || review.authorAvatarColor || 'var(--color-primary)' }}
                        >
                          {(authorUser?.displayName || review.authorName).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-main">
                            {authorUser?.displayName || review.authorName}
                          </span>
                          <span className="text-xs text-faint">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {isAuthor && (
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-muted hover:text-danger transition-colors p-1"
                            title="Delete review"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      
                      {review.rating && (
                        <div className="flex gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              size={12} 
                              className={star <= Math.ceil(review.rating! / 2) ? 'fill-warning text-warning' : 'text-default'} 
                            />
                          ))}
                        </div>
                      )}
                      
                      <p className="text-sm text-main whitespace-pre-wrap break-words leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Review Input */}
          <div className="p-4 sm:p-5 border-t border-border-subtle bg-base shrink-0">
            <form onSubmit={handleSubmitReview} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-main">Leave a Review</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star === rating ? 0 : star)}
                      className="p-1 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star 
                        size={18} 
                        className={star <= rating ? 'fill-warning text-warning' : 'text-muted hover:text-warning/50'} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="What did you think of it?"
                  rows={3}
                  className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none custom-scrollbar pr-12"
                />
                <button
                  type="submit"
                  disabled={!comment.trim() || isSubmitting}
                  className="absolute bottom-3 right-3 p-1.5 bg-primary text-on-primary rounded-lg disabled:opacity-50 hover:bg-primary-hover transition-colors"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
    </div>
  );

  return isMobile ? (
    <MobileBottomSheet isOpen={true} onClose={onClose} maxHeight="95vh">
      <div className="flex flex-col h-full w-full bg-base overflow-hidden relative" style={{ minHeight: '80vh' }}>
        {modalContent}
      </div>
    </MobileBottomSheet>
  ) : (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-border-subtle rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col md:flex-row max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {modalContent}
      </div>
    </div>
  );
};
