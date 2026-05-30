import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { addDoc } from '../../lib/firestore';
import { fetchLinkPreview } from '../../utils/linkPreview';
import type { LinkMetadata } from '../../utils/linkPreview';
import toast from 'react-hot-toast';
import { Link2, X, Loader2, Send } from 'lucide-react';
import type { Post } from '../../types';
import { getAvatarColor } from '../../utils/avatarColor';

interface PostComposerProps {
  composerRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export const PostComposer: React.FC<PostComposerProps> = ({ composerRef }) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState('');
  const [linkMeta, setLinkMeta] = useState<LinkMetadata | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Debounced URL preview fetcher
  useEffect(() => {
    if (!url || !url.startsWith('http')) {
      setLinkMeta(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoadingPreview(true);
      const meta = await fetchLinkPreview(url);
      setLinkMeta(meta);
      setIsLoadingPreview(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !linkMeta) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      const newPost = {
        authorId: user.id,
        content: content.trim(),
        linkUrl: linkMeta ? linkMeta.url : null,
        linkMeta: linkMeta || null,
        reactions: {},
        comments: [],
        isPinned: false,
        createdAt: Date.now(),
      };
      await addDoc<Omit<Post, 'id'>>('posts', newPost as any);
      setContent('');
      setUrl('');
      setShowUrlInput(false);
      setLinkMeta(null);
      toast.success('Posted successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLink = () => {
    setUrl('');
    setLinkMeta(null);
    setShowUrlInput(false);
  };

  const charsLeft = 500 - content.length;
  const hasContent = content.trim().length > 0 || !!linkMeta;
  const avatarBg = user ? getAvatarColor(user.displayName) : 'var(--color-primary)';

  /* ── Derived ring / glow ── */
  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-surface)',
    borderRadius: '1rem',
    border: isFocused
      ? '1.5px solid var(--color-primary)'
      : '1.5px solid var(--color-border)',
    boxShadow: isFocused
      ? '0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent), var(--shadow-sm)'
      : 'var(--shadow-md)',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
  };

  /* ── Char counter color ── */
  const counterColor =
    charsLeft <= 20
      ? 'var(--color-danger)'
      : charsLeft <= 100
      ? 'var(--color-warning)'
      : 'var(--color-text-faint)';

  return (
    <div style={cardStyle}>
      <form onSubmit={handleSubmit}>
        {/* ── Top section: avatar + textarea ── */}
        <div className="flex gap-3 px-4 pt-4 pb-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 select-none"
            style={{
              background: avatarBg,
              fontSize: '1rem',
              letterSpacing: '-0.01em',
              boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
            }}
          >
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>

          {/* Textarea */}
          <textarea
            ref={composerRef}
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ano latest? 👀"
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-main text-base leading-relaxed"
            style={{
              minHeight: '72px',
              paddingTop: '0.55rem',
              color: 'var(--color-text-main)',
            }}
            maxLength={500}
          />
        </div>

        {/* ── URL input (optional, revealed) ── */}
        {showUrlInput && (
          <div className="px-4 pb-3 animate-in fade-in slide-in-from-top-1 duration-150">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Link2 size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a link…"
                className="flex-1 bg-transparent border-none text-sm focus:ring-0 py-0.5"
                style={{ color: 'var(--color-text-main)' }}
              />
              <button
                type="button"
                onClick={handleRemoveLink}
                className="rounded-full p-1 transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>

            {isLoadingPreview && (
              <div
                className="flex items-center gap-2 mt-2 text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <Loader2 size={13} className="animate-spin" /> Fetching preview…
              </div>
            )}

            {linkMeta && (
              <div
                className="mt-3 rounded-xl overflow-hidden flex flex-col sm:flex-row w-full"
                style={{
                  border: '1px solid var(--color-border-subtle)',
                  background: 'var(--color-bg-base)',
                }}
              >
                {linkMeta.youtubeId ? (
                  <div className="w-full relative pt-[56.25%]">
                    <iframe
                      src={`https://www.youtube.com/embed/${linkMeta.youtubeId}`}
                      className="absolute top-0 left-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <>
                    {linkMeta.image && (
                      <div className="h-32 sm:h-24 sm:w-24 shrink-0 overflow-hidden">
                        <img src={linkMeta.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-3 flex flex-col justify-center min-w-0 w-full">
                      <h4 className="text-sm font-semibold text-main truncate">{linkMeta.title}</h4>
                      <p className="text-xs text-muted line-clamp-2 mt-1">{linkMeta.description}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            borderTop: '1px solid var(--color-border)',
            background: 'color-mix(in srgb, var(--color-bg-base) 60%, transparent)',
            borderRadius: '0 0 1rem 1rem',
          }}
        >
          {/* Left: attach-link button */}
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            title="Add link"
            className="rounded-full p-2 transition-all duration-150"
            style={{
              color: showUrlInput || url ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: showUrlInput || url
                ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
                : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!showUrlInput && !url)
                (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-base)';
            }}
            onMouseLeave={(e) => {
              if (!showUrlInput && !url)
                (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <Link2 size={17} />
          </button>

          {/* Right: counter + Post */}
          <div className="flex items-center gap-3">
            {/* Circular progress / char counter */}
            <div className="flex items-center gap-1.5">
              {/* Mini arc indicator when nearing limit */}
              {content.length > 0 && (
                <svg width="20" height="20" viewBox="0 0 20 20" className="rotate-[-90deg]">
                  <circle
                    cx="10" cy="10" r="8"
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="10" cy="10" r="8"
                    fill="none"
                    stroke={charsLeft <= 20 ? 'var(--color-danger)' : charsLeft <= 100 ? 'var(--color-warning)' : 'var(--color-primary)'}
                    strokeWidth="2.5"
                    strokeDasharray={`${2 * Math.PI * 8}`}
                    strokeDashoffset={`${2 * Math.PI * 8 * (charsLeft / 500)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.15s ease, stroke 0.15s ease' }}
                  />
                </svg>
              )}
              {charsLeft <= 50 && (
                <span
                  className="text-xs tabular-nums font-medium"
                  style={{ color: counterColor, minWidth: '1.75rem', textAlign: 'right' }}
                >
                  {charsLeft}
                </span>
              )}
            </div>

            {/* Post button */}
            <button
              type="submit"
              disabled={isSubmitting || !hasContent}
              className="flex items-center gap-2 rounded-full text-sm font-semibold"
              style={{
                padding: '0.45rem 1.1rem',
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                opacity: hasContent ? 1 : 0.38,
                cursor: !hasContent ? 'not-allowed' : 'pointer',
                boxShadow: hasContent ? '0 1px 6px color-mix(in srgb, var(--color-primary) 35%, transparent)' : 'none',
                transition: 'opacity 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                if (hasContent) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'scale(1.05)';
                  el.style.boxShadow = '0 2px 10px color-mix(in srgb, var(--color-primary) 45%, transparent)';
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'scale(1)';
                el.style.boxShadow = hasContent
                  ? '0 1px 6px color-mix(in srgb, var(--color-primary) 35%, transparent)'
                  : 'none';
              }}
            >
              {isSubmitting
                ? <Loader2 size={15} className="animate-spin" />
                : <Send size={14} strokeWidth={2.5} />
              }
              Post
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
