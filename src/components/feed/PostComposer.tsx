import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { addDoc } from '../../lib/firestore';
import { fetchLinkPreview } from '../../utils/linkPreview';
import type { LinkMetadata } from '../../utils/linkPreview';
import toast from 'react-hot-toast';
import { Link2, X, Loader2, Send, Image as ImageIcon, Palette as PaletteIcon, SmilePlus, Timer } from 'lucide-react';
import type { Post, User } from '../../types';
import { getAvatarColor } from '../../utils/avatarColor';

interface PostComposerProps {
  composerRef?: React.RefObject<HTMLTextAreaElement | null>;
  allUsers?: User[];
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

const DURATIONS = [
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '6 hours', value: 6 * 60 * 60 * 1000 },
  { label: '24 hours', value: 24 * 60 * 60 * 1000 },
  { label: '3 days', value: 3 * 24 * 60 * 60 * 1000 },
  { label: '7 days', value: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Never', value: null },
];

export const PostComposer: React.FC<PostComposerProps> = ({ composerRef, allUsers }) => {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState('');
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

  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [activePopover, setActivePopover] = useState<'feeling' | 'background' | 'timer' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Mentions
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionCursorPos, setMentionCursorPos] = useState<number | null>(null);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentions, setMentions] = useState<string[]>([]);

  // Focus modal textarea on open
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        if (composerRef && composerRef.current) {
          composerRef.current.focus();
        } else if (internalTextareaRef.current) {
          internalTextareaRef.current.focus();
        }
      }, 50);
    }
  }, [isModalOpen, composerRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === 'Escape') {
        if (activePopover) {
          setActivePopover(null);
        } else {
          handleCloseModal();
        }
      }
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
  }, [isModalOpen, activePopover, content, linkMeta, imageUrl]);

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

  const hasContent = content.trim().length > 0 || !!linkMeta || (!!imageUrl && !imagePreviewError);

  const handleCloseModal = () => {
    if (hasContent) {
      if (!window.confirm('Discard post?')) return;
    }
    setIsModalOpen(false);
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
    setSelectedDuration(null);
    setActivePopover(null);
    setShowMentionPicker(false);
    setMentions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasContent) return;
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
      if (selectedDuration) newPost.expiresAt = Date.now() + selectedDuration;
      if (mentions.length > 0) newPost.mentions = mentions;

      const postId = await addDoc<Omit<Post, 'id'>>('posts', newPost);
      
      import('../../lib/notifications').then(({ broadcastNotification, writeNotification }) => {
        broadcastNotification({
          type: 'post',
          fromUid: user.id,
          fromName: user.displayName,
          fromAvatarColor: user.accentColor || '#3b82f6',
          postId,
          message: `${user.displayName} posted something new`,
          preview: content.trim() 
            ? content.trim().slice(0, 60) 
            : (linkMeta ? 'shared a link' : (imageUrl ? 'shared an image' : '')),
        }, 'posts');

        mentions.forEach(mentionedUid => {
          writeNotification(mentionedUid, {
            type: 'mention',
            fromUid: user.id,
            fromName: user.displayName,
            fromAvatarColor: user.accentColor || '#3b82f6',
            postId,
            message: `${user.displayName} mentioned you in a post`,
            preview: content.trim().slice(0, 60),
          }, 'mentions');
        });
      });
      
      // Update group streak
      try {
        const { getDoc, setDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        const streakRef = doc(db, 'groupStats', 'streak');
        const streakSnap = await getDoc(streakRef);
        
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        if (streakSnap.exists()) {
          const streakData = streakSnap.data();
          if (streakData.lastPostDate === yesterdayStr) {
            const newStreak = (streakData.currentStreak || 0) + 1;
            await setDoc(streakRef, {
              currentStreak: newStreak,
              lastPostDate: todayStr,
              longestStreak: Math.max(streakData.longestStreak || 0, newStreak)
            }, { merge: true });
          } else if (streakData.lastPostDate < yesterdayStr) {
            // Streak broken, restart
            await setDoc(streakRef, {
              currentStreak: 1,
              lastPostDate: todayStr,
              longestStreak: streakData.longestStreak || 1
            }, { merge: true });
          } else if (!streakData.lastPostDate) {
            await setDoc(streakRef, { currentStreak: 1, lastPostDate: todayStr, longestStreak: 1 }, { merge: true });
          }
        } else {
          // First ever streak
          await setDoc(streakRef, { currentStreak: 1, lastPostDate: todayStr, longestStreak: 1 });
        }
      } catch (err) {
        console.error('Error updating streak:', err);
      }

      setIsModalOpen(false);
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
      setSelectedDuration(null);
      setActivePopover(null);
      setShowMentionPicker(false);
      setMentions([]);

      toast.success('Posted! 🎉');
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
  const avatarBg = user ? getAvatarColor(user.displayName) : 'var(--color-primary)';

  const counterColor =
    charsLeft <= 20
      ? 'var(--color-danger)'
      : charsLeft <= 100
      ? 'var(--color-warning)'
      : 'var(--color-text-faint)';

  const handleTriggerClick = (section?: 'image' | 'link' | 'feeling') => {
    setIsModalOpen(true);
    if (section === 'image') setShowImageInput(true);
    if (section === 'link') setShowUrlInput(true);
    if (section === 'feeling') setActivePopover('feeling');
  };

  const handleHiddenFocus = () => {
    if (!isModalOpen) {
      setIsModalOpen(true);
    }
  };

  const filteredMentions = React.useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => u.displayName.toLowerCase().startsWith(mentionFilter.toLowerCase()));
  }, [allUsers, mentionFilter]);

  const insertMention = (userToMention: User) => {
    if (mentionCursorPos === null) return;
    const textBeforeMention = content.slice(0, mentionCursorPos - mentionFilter.length - 1);
    const textAfterMention = content.slice(mentionCursorPos);
    const newContent = `${textBeforeMention}@${userToMention.displayName} ${textAfterMention}`;
    setContent(newContent.slice(0, 500));
    setShowMentionPicker(false);
    setMentions(prev => prev.includes(userToMention.id) ? prev : [...prev, userToMention.id]);
    
    setTimeout(() => {
      const textarea = composerRef?.current || internalTextareaRef.current;
      if (textarea) {
        textarea.focus();
        const newPos = textBeforeMention.length + userToMention.displayName.length + 2;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, 500);
    setContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      setShowMentionPicker(true);
      setMentionFilter(match[1]);
      setMentionCursorPos(cursorPos);
      setMentionSelectedIndex(0);
    } else {
      setShowMentionPicker(false);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPicker) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionSelectedIndex(prev => Math.min(prev + 1, filteredMentions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredMentions[mentionSelectedIndex]) {
          insertMention(filteredMentions[mentionSelectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionPicker(false);
      }
    }
  };

  return (
    <>
      {!isModalOpen && (
        <textarea
          ref={composerRef}
          onFocus={handleHiddenFocus}
          className="sr-only absolute w-0 h-0 p-0 m-0 opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      )}

      {/* Trigger Row */}
      <div 
        className="rounded-xl shadow-sm p-4"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => handleTriggerClick()}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-sm"
            style={{
              background: user?.avatarUrl ? undefined : avatarBg,
            }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              user?.displayName?.charAt(0).toUpperCase()
            )}
          </div>
          {/* Input-like area */}
          <div 
            className="flex-1 rounded-full px-4 py-2.5 text-sm transition-colors border"
            style={{
              background: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-base)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
          >
            Ano latest? 👀
          </div>
        </div>

        {/* Quick actions */}
        <div 
          className="flex items-center gap-1 mt-3 pt-3"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <button
            onClick={() => handleTriggerClick('image')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            <ImageIcon size={15} /> <span className="hidden sm:inline">Image</span>
          </button>
          <div className="w-px h-3" style={{ background: 'var(--color-border-subtle)' }} />
          <button
            onClick={() => handleTriggerClick('link')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            <Link2 size={15} /> <span className="hidden sm:inline">Link</span>
          </button>
          <div className="w-px h-3" style={{ background: 'var(--color-border-subtle)' }} />
          <button
            onClick={() => handleTriggerClick('feeling')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            <span className="text-[13px] leading-none">😄</span> <span className="hidden sm:inline">Feeling</span>
          </button>
        </div>
      </div>

      {/* Composer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 transition-opacity" 
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={handleCloseModal} 
          />
          <div 
            ref={cardRef}
            className="relative w-full max-w-[560px] rounded-2xl shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              maxHeight: '90vh'
            }}
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{ background: user?.avatarUrl ? undefined : avatarBg }}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    user?.displayName?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-main)' }}>
                    {user?.displayName}
                  </span>
                  {user?.role === 'admin' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex w-max" style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}>
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="p-1.5 rounded-full transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <form id="composer-form" onSubmit={handleSubmit} className="flex flex-col flex-1">
                <div 
                  className={`relative flex flex-1 ${selectedBgColor ? 'rounded-xl overflow-hidden' : ''}`}
                  style={{ 
                    background: selectedBgColor || 'transparent',
                    minHeight: selectedBgColor ? '180px' : 'auto',
                    alignItems: selectedBgColor ? 'center' : 'stretch',
                    justifyContent: selectedBgColor ? 'center' : 'flex-start',
                    padding: selectedBgColor ? '24px' : '0',
                    margin: '0',
                    transition: 'background 300ms ease',
                  }}
                >
                  <div className={`flex-1 flex flex-col justify-center w-full ${selectedBgColor ? '' : 'px-4 py-3'}`}>
                    <style>
                      {`
                        .composer-textarea::placeholder {
                          color: ${selectedBgColor ? 'rgba(255,255,255,0.7)' : 'var(--color-text-faint)'};
                        }
                      `}
                    </style>
                    <textarea
                      ref={composerRef || internalTextareaRef}
                      value={content}
                      onChange={handleTextareaChange}
                      onKeyDown={handleTextareaKeyDown}
                      placeholder="Ano latest? 👀"
                      className={`composer-textarea bg-transparent border-none focus:ring-0 focus:outline-none resize-none leading-relaxed w-full custom-scrollbar ${
                        selectedBgColor 
                          ? 'text-center text-xl font-semibold' 
                          : 'text-base mt-1'
                      }`}
                      style={{
                        color: selectedBgColor ? '#ffffff' : 'var(--color-text-main)',
                        caretColor: selectedBgColor ? '#ffffff' : 'auto',
                        minHeight: selectedBgColor ? 'auto' : '120px',
                      }}
                      rows={selectedBgColor ? 1 : 4}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                      maxLength={500}
                    />
                  </div>
                </div>

                {/* Mentions Picker */}
                <div className="relative">
                  {showMentionPicker && filteredMentions.length > 0 && (
                    <div 
                      className="absolute bottom-full mb-2 left-4 z-50 rounded-xl shadow-lg border max-h-[200px] overflow-y-auto custom-scrollbar"
                      style={{
                        background: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border-default)',
                        minWidth: '200px'
                      }}
                    >
                      {filteredMentions.map((mu, i) => (
                        <div 
                          key={mu.id}
                          onClick={() => insertMention(mu)}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${i === mentionSelectedIndex ? 'bg-surface' : 'hover:bg-surface'}`}
                          style={{
                            background: i === mentionSelectedIndex ? 'var(--color-bg-surface)' : 'transparent'
                          }}
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow-sm flex-shrink-0" style={{ background: mu.avatarUrl ? undefined : getAvatarColor(mu.displayName) }}>
                            {mu.avatarUrl ? <img src={mu.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : mu.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-main">{mu.displayName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inputs row BETWEEN textarea and toolbar */}
                {showImageInput && (
                  <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-surface)' }}>
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
                          className="w-full max-h-[300px] object-cover block"
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
                  <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-surface)' }}>
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
              </form>
            </div>

            {/* Modal Footer / Toolbar */}
            <div 
              className="flex items-center justify-between px-4 py-3 border-t relative shrink-0"
              style={{ 
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg-surface)',
              }}
            >
              {/* Popovers */}
              {activePopover === 'feeling' && (
                <div 
                  className="absolute bottom-full mb-3 left-4 z-50 p-3 rounded-xl shadow-lg"
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
                  className="absolute bottom-full mb-3 left-32 z-50 p-3 rounded-xl shadow-lg"
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

              {activePopover === 'timer' && (
                <div 
                  className="absolute bottom-full mb-3 left-40 z-50 p-3 rounded-xl shadow-lg"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-default)',
                    width: 'max-content'
                  }}
                >
                  <h4 className="text-xs mb-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Post expires in...</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATIONS.map((dur) => {
                      const isSelected = selectedDuration === dur.value;
                      return (
                        <button
                          key={dur.label}
                          type="button"
                          onClick={() => {
                            setSelectedDuration(dur.value);
                            setActivePopover(null);
                          }}
                          className="px-3 py-1.5 rounded-full text-sm transition-all"
                          style={{
                            background: isSelected ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'transparent',
                            border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                            color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)'
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--color-bg-base)'; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {dur.label}
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
                  <ImageIcon size={20} />
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
                  <Link2 size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'feeling' ? null : 'feeling')}
                  title="Feeling"
                  className="p-2 rounded-md transition-colors flex items-center justify-center"
                  style={{
                    color: selectedVibeTag ? selectedVibeTag.color : 'var(--color-text-muted)',
                    background: selectedVibeTag ? `color-mix(in srgb, ${selectedVibeTag.color} 10%, transparent)` : (activePopover === 'feeling' ? 'var(--color-bg-elevated)' : 'transparent')
                  }}
                  onMouseEnter={(e) => { if (!selectedVibeTag && activePopover !== 'feeling') { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; } }}
                  onMouseLeave={(e) => { if (!selectedVibeTag && activePopover !== 'feeling') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
                >
                  {selectedVibeTag ? (
                     <span className="text-xl leading-none">{selectedVibeTag.emoji}</span>
                  ) : (
                     <SmilePlus size={20} />
                  )}
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
                    <PaletteIcon size={20} />
                  </button>
                  {selectedBgColor && (
                    <div 
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ background: selectedBgColor }}
                    />
                  )}
                </div>
                <div className="relative flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setActivePopover(activePopover === 'timer' ? null : 'timer')}
                    title="Timer"
                    className="p-2 rounded-md transition-colors flex items-center justify-center relative gap-1"
                    style={{
                      color: activePopover === 'timer' ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                      background: activePopover === 'timer' ? 'var(--color-bg-elevated)' : 'transparent'
                    }}
                    onMouseEnter={(e) => { if (activePopover !== 'timer') { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-main)'; } }}
                    onMouseLeave={(e) => { if (activePopover !== 'timer') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
                  >
                    <Timer size={20} />
                    {selectedDuration && (
                      <span className="text-xs font-medium" style={{ color: 'var(--color-warning)' }}>
                        {DURATIONS.find(d => d.value === selectedDuration)?.label.replace(' hours', 'h').replace(' hour', 'h').replace(' days', 'd')}
                      </span>
                    )}
                  </button>
                  {selectedDuration && (
                    <div 
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                      style={{ background: 'var(--color-warning)' }}
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
                  form="composer-form"
                  disabled={isSubmitting || !hasContent}
                  className="flex items-center gap-2 rounded-full text-sm font-semibold"
                  style={{
                    padding: '0.45rem 1.25rem',
                    background: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    opacity: hasContent ? 1 : 0.4,
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
                    : <Send size={15} strokeWidth={2.5} />
                  }
                  Post
                </button>
              </div>
            </div>
            
            {/* Warning Note */}
            {selectedDuration && (
              <div 
                className="px-4 py-2 text-xs italic border-t"
                style={{ 
                  color: 'var(--color-text-faint)', 
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-base)'
                }}
              >
                ⏱️ This post will disappear after {DURATIONS.find(d => d.value === selectedDuration)?.label}. Only you can see this timer.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
