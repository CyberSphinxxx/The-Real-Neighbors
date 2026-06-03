import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Share2, Loader2, Image as ImageIcon, Link2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import type { RedditPost } from '../../types';
import { getAvatarColor } from '../../utils/avatarColor';

interface Props {
  post: RedditPost;
  onClose: () => void;
  onShare: (caption: string) => Promise<void>;
}

export const ShareRedditPostModal: React.FC<Props> = ({ post, onClose, onShare }) => {
  const { user } = useAuthStore();
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onShare(caption.trim());
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const charsLeft = 280 - caption.length;
  const isImage = post.is_reddit_media_domain || post.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  const isVideo = post.is_video;
  const isLink = !isImage && !isVideo && post.url && !post.url.includes('reddit.com/r/');

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isSubmitting ? onClose : undefined} />
      
      <div 
        className="relative w-full max-w-[520px] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <h2 className="text-base font-heading font-bold flex items-center gap-2.5" style={{ color: 'var(--color-text-main)' }}>
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}
            >
              <Share2 size={14} />
            </div>
            Share Reddit Post
          </h2>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            style={{ color: 'var(--color-text-faint)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-faint)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <form id="share-form" onSubmit={handleSubmit}>
            
            {/* Sharing As — User Identity */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 overflow-hidden"
                  style={{ background: user?.avatarUrl ? undefined : getAvatarColor(user?.displayName || '?') }}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.displayName?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-main)' }}>
                    {user?.displayName}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
                    Sharing to your feed
                  </span>
                </div>
              </div>
            </div>

            {/* Caption Input */}
            <div className="px-5 pb-4">
              <div 
                className="rounded-xl p-3 transition-all"
                style={{ 
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border-subtle)',
                }}
                onClick={() => textareaRef.current?.focus()}
              >
                <textarea 
                  ref={textareaRef}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 280))}
                  placeholder="Say something about this... (optional)"
                  className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none resize-none min-h-[72px] text-sm leading-relaxed custom-scrollbar"
                  style={{ color: 'var(--color-text-main)' }}
                  disabled={isSubmitting}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                  }}
                />
                {caption.length > 0 && (
                  <div className="flex justify-end pt-1">
                    <span 
                      className="text-[11px] font-medium tabular-nums"
                      style={{ color: charsLeft <= 20 ? 'var(--color-danger)' : 'var(--color-text-faint)' }}
                    >
                      {charsLeft}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider with label */}
            <div className="px-5 flex items-center gap-3 pb-3">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border-subtle)' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-faint)' }}>
                Reddit Post
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border-subtle)' }} />
            </div>

            {/* Post Preview — Rich Card */}
            <div className="px-5 pb-5">
              <div 
                className="rounded-xl overflow-hidden"
                style={{ 
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                {/* Preview Header */}
                <div 
                  className="flex items-center gap-2.5 px-4 py-3"
                  style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px] overflow-hidden flex-shrink-0"
                    style={{ background: '#FF4500' }}
                  >
                    🤖
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-[13px] truncate" style={{ color: 'var(--color-text-main)' }}>
                      r/{post.subreddit}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
                      u/{post.author}
                    </span>
                  </div>
                </div>

                {/* Preview Body */}
                <div className="px-4 py-3">
                  <h4 className="font-semibold text-[13px] text-main mb-1">{post.title}</h4>
                  {post.selftext && (
                    <p 
                      className="text-[12px] leading-relaxed whitespace-pre-wrap break-words line-clamp-3 text-muted"
                    >
                      {post.selftext}
                    </p>
                  )}
                </div>

                {/* Image / Link attachment indicator */}
                {(isImage || isLink) && (
                  <div 
                    className="px-4 py-2.5 flex items-center gap-4"
                    style={{ borderTop: '1px solid var(--color-border-subtle)' }}
                  >
                    {isImage && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        <ImageIcon size={12} /> Media attached
                      </div>
                    )}
                    {isLink && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        <Link2 size={12} /> Link attached
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div 
          className="px-5 py-3.5 flex items-center justify-end gap-2.5 flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="share-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 flex items-center gap-2"
            style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Sharing...
              </>
            ) : (
              <>
                <Share2 size={14} /> Share Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
