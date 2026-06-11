import React, { useState } from 'react';
import { Music2, CheckCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { setDoc } from '../../lib/firestore';
import { isValidSpotifyPlaylistUrl, fetchPlaylistMeta, extractPlaylistId } from '../../lib/spotify';
import type { Playlist, User } from '../../types';
import toast from 'react-hot-toast';
import { MobileBottomSheet } from '../ui/MobileBottomSheet';

const GENRES = [
  { emoji: '🎵', label: 'Pop', color: '#ec4899' },
  { emoji: '🎸', label: 'Rock', color: '#ef4444' },
  { emoji: '🎹', label: 'OPM', color: '#f97316' },
  { emoji: '🌸', label: 'J-Pop', color: '#a855f7' },
  { emoji: '🎌', label: 'Anime', color: '#3b82f6' },
  { emoji: '🎧', label: 'Hip-Hop', color: '#facc15' },
  { emoji: '🌊', label: 'R&B', color: '#14b8a6' },
  { emoji: '⚡', label: 'EDM', color: '#06b6d4' },
  { emoji: '🎷', label: 'Jazz', color: '#f59e0b' },
  { emoji: '🎻', label: 'Classical', color: '#8b5cf6' },
  { emoji: '🎮', label: 'Gaming OST', color: '#22c55e' },
  { emoji: '😌', label: 'Lo-fi', color: '#64748b' },
  { emoji: '✨', label: 'Custom', color: 'var(--color-primary)' },
];

interface AddPlaylistModalProps {
  onClose: () => void;
  allUsers: User[];
}

export const AddPlaylistModal: React.FC<AddPlaylistModalProps> = ({ onClose, allUsers }) => {
  const { user } = useAuthStore();
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<{ emoji: string, label: string, color: string } | null>(null);
  const [customGenreText, setCustomGenreText] = useState('');
  
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [metaError, setMetaError] = useState('');
  const [previewMeta, setPreviewMeta] = useState<{ title: string; thumbnailUrl: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUrlBlur = async () => {
    if (!url.trim()) return;
    
    if (!isValidSpotifyPlaylistUrl(url)) {
      setMetaError('Not a valid Spotify playlist link');
      setPreviewMeta(null);
      return;
    }

    setIsLoadingMeta(true);
    setMetaError('');
    try {
      const meta = await fetchPlaylistMeta(url);
      setPreviewMeta(meta);
    } catch (err: unknown) {
      setMetaError((err as Error).message || 'Could not load playlist.');
      setPreviewMeta(null);
    } finally {
      setIsLoadingMeta(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setMetaError('');
    setPreviewMeta(null);
  };

  const handleSubmit = async () => {
    if (!user || !previewMeta) return;

    const playlistId = extractPlaylistId(url);
    if (!playlistId) return;

    setIsSubmitting(true);
    try {
      const newPlaylist: Playlist = {
        id: playlistId,
        spotifyId: playlistId,
        spotifyUrl: url,
        title: previewMeta.title,
        thumbnailUrl: previewMeta.thumbnailUrl,
        addedBy: user.id,
        addedByName: user.displayName,
        addedByAvatarColor: user.accentColor || '#3b82f6',
        addedAt: Date.now(),
        ratings: {},
        reactions: {},
        nowVibing: [],
        description: description.trim() || undefined,
        vibeTag: selectedGenre ? (selectedGenre.label === 'Custom' ? { emoji: '✨', label: customGenreText.trim() || 'Custom', color: 'var(--color-primary)' } : selectedGenre) : undefined,
      };

      await setDoc('playlists', [playlistId], newPlaylist);

      // Send notification to others
      import('../../lib/notifications').then(({ writeNotification }) => {
        allUsers.forEach(u => {
          if (u.id !== user.id) {
            writeNotification(u.id, {
              type: 'post',
              fromUid: user.id,
              fromName: user.displayName,
              fromAvatarColor: user.accentColor || '#3b82f6',
              message: `${user.displayName} added a playlist: ${previewMeta.title} 🎵`,
            }, 'events');
          }
        });
      });

      toast.success('Playlist added! 🎵');
      onClose();
    } catch (error) {
      console.error('Failed to add playlist', error);
      toast.error('Failed to add playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const modalContent = (
    <>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <Music2 size={18} className="text-primary" />
            <h2 className="font-semibold text-lg text-main">Add a Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-main hover:bg-elevated rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-main mb-1.5">Spotify Playlist Link</label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={handleUrlChange}
                onBlur={handleUrlBlur}
                placeholder="Paste Spotify playlist URL..."
                className={`w-full bg-elevated rounded-xl border ${metaError ? 'border-danger focus:border-danger' : isLoadingMeta ? 'border-primary' : 'border-border-subtle focus:border-primary'} px-4 py-3 text-sm text-main outline-none transition-colors`}
              />
              {isLoadingMeta && (
                <div className="absolute right-3 top-3">
                  <Loader2 size={18} className="animate-spin text-primary" />
                </div>
              )}
            </div>
            {metaError ? (
              <p className="mt-1.5 text-xs text-danger">{metaError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-faint">Only public playlists can be added</p>
            )}
          </div>

          {/* Preview Card */}
          {previewMeta && !isLoadingMeta && !metaError && (
            <div className="mt-3 p-3 bg-elevated rounded-xl border border-border-subtle flex items-center gap-3 animate-in fade-in zoom-in-95">
              <img src={previewMeta.thumbnailUrl} alt="Cover" className="w-14 h-14 rounded-lg object-cover shadow-sm" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-main truncate">{previewMeta.title}</h4>
                <p className="text-xs text-faint">Spotify Playlist</p>
                <div className="flex items-center gap-1 mt-1 text-success text-xs font-medium">
                  <CheckCircle size={14} /> Ready to add
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-main mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 120) setDescription(e.target.value);
              }}
              placeholder="What's this playlist about?"
              rows={2}
              className="w-full bg-elevated rounded-xl border border-border-subtle focus:border-primary px-4 py-3 text-sm text-main resize-none outline-none transition-colors"
            />
            <div className="mt-1 flex justify-end">
              <span className={`text-xs ${description.length >= 120 ? 'text-warning' : 'text-faint'}`}>
                {description.length} / 120
              </span>
            </div>
          </div>

          {/* Genre */}
          <div className="mt-3">
            <div className="mb-2">
              <label className="block text-sm font-medium text-main">Genre</label>
              <p className="text-xs text-faint">What kind of music is this?</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => {
                const isSelected = selectedGenre?.label === genre.label;
                const activeColor = genre.color;
                
                return (
                  <button
                    key={genre.label}
                    onClick={() => {
                      setSelectedGenre(isSelected ? null : genre);
                      if (!isSelected && genre.label === 'Custom') setCustomGenreText('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: isSelected ? `color-mix(in srgb, ${activeColor} 15%, transparent)` : 'var(--color-bg-surface)',
                      color: isSelected ? activeColor : 'var(--color-text-muted)',
                      border: `1px solid ${isSelected ? activeColor : 'var(--color-border-border-subtle)'}`,
                    }}
                  >
                    <span>{genre.emoji}</span>
                    <span>{genre.label}</span>
                  </button>
                );
              })}
            </div>
            {selectedGenre?.label === 'Custom' && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <input
                  type="text"
                  value={customGenreText}
                  onChange={(e) => {
                    if (e.target.value.length <= 20) setCustomGenreText(e.target.value);
                  }}
                  placeholder="Enter genre name..."
                  className="w-full bg-elevated rounded-xl border border-border-subtle focus:border-primary px-4 py-2.5 text-sm text-main outline-none transition-colors"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle flex justify-between items-center bg-surface shrink-0">
          <span className="text-xs text-faint">From Spotify &middot; Public only</span>
          <button
            onClick={handleSubmit}
            disabled={!previewMeta || isSubmitting}
            className="flex items-center gap-1.5 bg-primary text-on-primary font-medium text-sm px-5 py-2 rounded-full hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Adding...
              </>
            ) : (
              'Add Playlist'
            )}
          </button>
        </div>
    </>
  );

  return isMobile ? (
    <MobileBottomSheet isOpen={true} onClose={onClose} maxHeight="90vh">
      <div className="flex flex-col h-full w-full bg-base overflow-hidden relative" style={{ minHeight: '60vh' }}>
        {modalContent}
      </div>
    </MobileBottomSheet>
  ) : (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-[480px] bg-surface border border-border-subtle rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {modalContent}
      </div>
    </div>
  );
};
