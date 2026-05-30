import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { addDoc } from '../../lib/firestore';
import { fetchLinkPreview } from '../../utils/linkPreview';
import type { LinkMetadata } from '../../utils/linkPreview';
import toast from 'react-hot-toast';
import { Link2, X, Loader2, Send, Image as ImageIcon, Palette as PaletteIcon } from 'lucide-react';
import type { Post } from '../../types';
import { getAvatarColor } from '../../utils/avatarColor';

interface PostComposerProps {
  composerRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const VIBE_TAGS = [
  { emoji: '😄', label: 'Chill', color: '#22c55e' },
  { emoji: '🔥', label: 'Hype', color: '#f97316' },
  { emoji: '😴', label: 'Lutang', color: '#8b5cf6' },
  { emoji: '🎮', label: 'Gaming', color: '#3b82f6' },
  { emoji: '🍜', label: 'Kain', color: '#eab308' },
  { emoji: '😤', label: 'Rant', color: '#ef4444' },
  { emoji: '🎵', label: 'Vibing', color: '#ec4899' },
  { emoji: '💤', label: 'Tamad', color: '#64748b' },
];

const BG_COLORS = [
  { label: 'None', value: '' },
  { label: 'Midnight', value: 'linear-gradient(135deg, #0f0c29, #302b63)' },
  { label: 'Sunset', value: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { label: 'Ocean', value: 'linear-gradient(135deg, #0093E9, #80D0C7)' },
  { label: 'Forest', value: 'linear-gradient(135deg, #134E5E, #71B280)' },
  { label: 'Candy', value: 'linear-gradient(135deg, #fddb92, #d1fdff)' },
  { label: 'Fire', value: 'linear-gradient(135deg, #f12711, #f5af19)' },
  { label: 'Galaxy', value: 'linear-gradient(135deg, #360033, #0b8793)' },
  { label: 'Rose', value: 'linear-gradient(135deg, #f953c6, #b91d73)' },
];

export const PostComposer: React.FC<PostComposerProps> = ({ composerRef }) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState('');
  const [linkMeta, setLinkMeta] = useState<LinkMetadata | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // New Features States
  const [selectedVibeTag, setSelectedVibeTag] = useState<{ emoji: string; label: string; color: string } | null>(null);
  const [selectedBgColor, setSelectedBgColor] = useState<string>('');
  
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  const [activePopover, setActivePopover] = useState<'feeling' | 'background' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePopover(null);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Handle Image URL input
  useEffect(() => {
    setImagePreviewError(false);
    if (!imageUrlInput || !imageUrlInput.startsWith('http')) {
      setImageUrl(null);
      return;
    }
    const timer = setTimeout(() => {
      setImageUrl(imageUrlInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [imageUrlInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !linkMeta && !imageUrl) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      const newPost: any = {
        authorId: user.id,
        content: content.trim(),
        linkUrl: linkMeta ? linkMeta.url : null,
        linkMeta: linkMeta || null,
        reactions: {},
        comments: [],
        isPinned: false,
        createdAt: Date.now(),
      };

      if (selectedVibeTag) newPost.vibeTag = selectedVibeTag;
      if (selectedBgColor) newPost.bgColor = selectedBgColor;
      if (!imagePreviewError && imageUrl) newPost.imageUrl = imageUrl;

      await addDoc<Omit<Post, 'id'>>('posts', newPost);
      setContent('');
      setUrl('');
      setShowUrlInput(false);
      setLinkMeta(null);
      
      setSelectedVibeTag(null);
      setSelectedBgColor('');
      setShowImageInput(false);
      setImageUrlInput('');
      setImageUrl(null);
      setImagePreviewError(false);

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

  const handleRemoveImage = () => {
    setImageUrlInput('');
    setImageUrl(null);
    setImagePreviewError(false);
    setShowImageInput(false);
  };

  const charsLeft = 500 - content.length;
  const hasContent = content.trim().length > 0 || !!linkMeta || (!!imageUrl && !imagePreviewError);
  const avatarBg = user ? getAvatarColor(user.displayName) : 'var(--color-primary)';

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-surface)',
    borderRadius: '1rem',
    border: isFocused
      ? '1px solid var(--color-primary)'
      : '1px solid var(--color-border)',
    boxShadow: isFocused
      ? 'var(--shadow-md)'
      : 'var(--shadow-sm)',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
  };

  const counterColor =
    charsLeft <= 20
      ? 'var(--color-danger)'
      : charsLeft <= 100
      ? 'var(--color-warning)'
      : 'var(--color-text-faint)';

  return (
    <div ref={cardRef} style={cardStyle} className="overflow-visible relative">
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Top Area: Avatar + Textarea */}
        <div 
          className="relative transition-all duration-300 flex"
          style={{ 
            background: selectedBgColor || 'transparent',
            minHeight: selectedBgColor ? '200px' : 'auto',
            borderRadius: '1rem 1rem 0 0',
          }}
        >
          {/* Avatar */}
          <div className={`pt-4 pl-4 pb-2 pr-2 ${selectedBgColor ? 'absolute top-0 left-0 z-10 pointer-events-none' : ''}`}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${selectedBgColor ? 'pointer-events-auto' : ''}`}
              style={{
                background: user?.avatarUrl ? undefined : avatarBg,
                fontSize: '1rem',
              }}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                user?.displayName?.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* Textarea */}
          <div className={`flex-1 flex flex-col justify-center min-h-[72px] w-full ${selectedBgColor ? 'px-8 py-8' : 'py-2 pr-4 pl-2'}`}>
            <textarea
              ref={composerRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ano latest? 👀"
              className={`bg-transparent border-none focus:ring-0 focus:outline-none resize-none leading-relaxed w-full custom-scrollbar ${
                selectedBgColor 
                  ? 'text-center text-3xl font-bold font-heading placeholder:text-white/80' 
                  : 'text-base placeholder:opacity-70 mt-2'
              }`}
              style={{
                color: selectedBgColor ? '#ffffff' : 'var(--color-text-main)',
                textShadow: selectedBgColor ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                minHeight: '40px',
              }}
              rows={selectedBgColor ? 3 : 1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
              maxLength={500}
            />
          </div>
        </div>

        {/* Inputs row BETWEEN textarea and toolbar */}
        {showImageInput && (
          <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-surface)' }}>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1"
              style={{
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
              }}
            >
              <ImageIcon size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Paste image URL... (jpg, png, gif, webp)"
                className="flex-1 bg-transparent border-none text-sm focus:ring-0 py-0.5"
                style={{ color: 'var(--color-text-main)' }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="rounded-full p-1 transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
            {imageUrl && !imagePreviewError && (
              <div className="mt-2 relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border-subtle)' }}>
                <img 
                  src={imageUrl} 
                  alt="Attachment Preview" 
                  className="w-full max-h-[200px] object-cover block"
                  onError={() => setImagePreviewError(true)}
                />
              </div>
            )}
            {imagePreviewError && imageUrlInput && (
               <div className="mt-1 text-xs font-medium px-1 flex items-center gap-1.5 text-danger">
                 <X size={12} /> Image couldn't be loaded. Check the URL.
               </div>
            )}
          </div>
        )}

        {showUrlInput && (
          <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-surface)' }}>
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
                className="mt-2 rounded-xl overflow-hidden flex flex-col sm:flex-row w-full"
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

        {/* Toolbar Row */}
        <div 
          className="flex items-center justify-between px-4 py-2 border-t relative"
          style={{ 
            borderColor: 'var(--color-border-subtle)',
            background: 'var(--color-bg-surface)',
            borderRadius: '0 0 1rem 1rem'
          }}
        >
          {/* Popovers */}
          {activePopover === 'feeling' && (
            <div 
              className="absolute bottom-full mb-2 left-4 z-50 p-3 rounded-xl shadow-lg"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-default)',
                width: 'max-content'
              }}
            >
              <h4 className="text-xs mb-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>How are you feeling?</h4>
              <div className="grid grid-cols-4 gap-2">
                {VIBE_TAGS.map((tag) => {
                  const isSelected = selectedVibeTag?.label === tag.label;
                  return (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => {
                        setSelectedVibeTag(isSelected ? null : tag);
                        setActivePopover(null);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        color: isSelected ? tag.color : 'var(--color-text-main)',
                        border: `1px solid color-mix(in srgb, ${tag.color} ${isSelected ? '100%' : '40%'}, transparent)`,
                        background: isSelected 
                          ? `color-mix(in srgb, ${tag.color} 20%, transparent)` 
                          : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = `color-mix(in srgb, ${tag.color} 15%, transparent)`;
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span>{tag.emoji}</span>
                      <span>{tag.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activePopover === 'background' && (
            <div 
              className="absolute bottom-full mb-2 left-32 z-50 p-3 rounded-xl shadow-lg"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-default)',
                width: 'max-content'
              }}
            >
              <h4 className="text-xs mb-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Post background</h4>
              <div className="grid grid-cols-5 gap-2">
                {BG_COLORS.map((bg) => {
                  const isSelected = selectedBgColor === bg.value;
                  return (
                    <button
                      key={bg.label}
                      type="button"
                      title={bg.label}
                      onClick={() => {
                        setSelectedBgColor(bg.value);
                        setActivePopover(null);
                      }}
                      className="w-7 h-7 rounded-full flex-shrink-0 relative overflow-hidden transition-all duration-200"
                      style={{
                        background: bg.value || 'var(--color-bg-base)',
                        border: bg.value ? 'none' : '1px solid var(--color-border)',
                        boxShadow: isSelected 
                          ? '0 0 0 2px var(--color-bg-elevated), 0 0 0 2px var(--color-primary)' 
                          : 'none',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {!bg.value && (
                        <div className="absolute top-1/2 left-[-20%] w-[140%] h-[1.5px] bg-danger rotate-45 transform origin-center" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              title="Add Image"
              className="p-2 rounded-md transition-colors flex items-center justify-center"
              style={{
                color: showImageInput || imageUrlInput ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: showImageInput || imageUrlInput ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent'
              }}
              onMouseEnter={(e) => { if (!showImageInput && !imageUrlInput) { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; } }}
              onMouseLeave={(e) => { if (!showImageInput && !imageUrlInput) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
            >
              <ImageIcon size={18} />
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              title="Add Link"
              className="p-2 rounded-md transition-colors flex items-center justify-center"
              style={{
                color: showUrlInput || url ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: showUrlInput || url ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent'
              }}
              onMouseEnter={(e) => { if (!showUrlInput && !url) { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; } }}
              onMouseLeave={(e) => { if (!showUrlInput && !url) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
            >
              <Link2 size={18} />
            </button>
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === 'feeling' ? null : 'feeling')}
              title="Feeling"
              className="px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium text-sm"
              style={{
                color: selectedVibeTag ? selectedVibeTag.color : 'var(--color-text-muted)',
                background: selectedVibeTag ? `color-mix(in srgb, ${selectedVibeTag.color} 10%, transparent)` : (activePopover === 'feeling' ? 'var(--color-bg-elevated)' : 'transparent')
              }}
              onMouseEnter={(e) => { if (!selectedVibeTag && activePopover !== 'feeling') { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; } }}
              onMouseLeave={(e) => { if (!selectedVibeTag && activePopover !== 'feeling') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
            >
              <span>{selectedVibeTag ? selectedVibeTag.emoji : '😄'}</span>
              <span>{selectedVibeTag ? selectedVibeTag.label : 'Feeling'}</span>
            </button>
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'background' ? null : 'background')}
                title="Background"
                className="p-2 rounded-md transition-colors flex items-center justify-center relative"
                style={{
                  color: activePopover === 'background' ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                  background: activePopover === 'background' ? 'var(--color-bg-elevated)' : 'transparent'
                }}
                onMouseEnter={(e) => { if (activePopover !== 'background') { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; } }}
                onMouseLeave={(e) => { if (activePopover !== 'background') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
              >
                <PaletteIcon size={18} />
              </button>
              {selectedBgColor && (
                <div 
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ background: selectedBgColor }}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
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
              }}
              onMouseEnter={(e) => {
                if (hasContent) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'scale(1)';
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
