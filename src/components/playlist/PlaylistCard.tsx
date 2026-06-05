import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { updateDoc, deleteDoc } from '../../lib/firestore';
import { getDocs, collection, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatTimeAgo } from '../../utils/date';
import { MoreHorizontal, Trash2, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { StarRating } from '../ui/StarRating';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import { useConfirm } from '../../contexts/ConfirmContext';
import toast from 'react-hot-toast';
import type { Playlist, User } from '../../types';

interface PlaylistCardProps {
  playlist: Playlist;
  allUsers: User[];
}

const REACTIONS = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '💀', label: 'Skull' },
];

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, allUsers }) => {
  const { user } = useAuthStore();
  const { confirm } = useConfirm();
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState<'details' | 'comments'>('details');
  const [showMenu, setShowMenu] = useState(false);
  const [isUpdatingReaction, setIsUpdatingReaction] = useState(false);

  const handleToggleReaction = async (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
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

  const handleOpenComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDetailInitialTab('comments');
    setShowDetailModal(true);
  };

  const handleOpenCard = () => {
    setDetailInitialTab('details');
    setShowDetailModal(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    const isConfirmed = await confirm({
      title: 'Remove Playlist?',
      message: "This will delete the playlist and all its comments. This can't be undone.",
      isDanger: true,
      confirmText: 'Remove',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      try {
        const commentsRef = collection(db, 'playlists', playlist.id, 'comments');
        const commentsSnap = await getDocs(query(commentsRef));
        
        const { deleteDoc: firestoreDeleteDoc } = await import('firebase/firestore');
        await Promise.all(commentsSnap.docs.map(d => firestoreDeleteDoc(d.ref)));
        
        await deleteDoc('playlists', playlist.id);
        toast.success('Playlist removed');
      } catch (error) {
        console.error('Failed to delete playlist', error);
        toast.error('Failed to remove playlist');
      }
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    navigator.clipboard.writeText(playlist.spotifyUrl);
    toast.success('Link copied!');
  };

  const isAdmin = user?.role === 'admin';
  const canDelete = user?.id === playlist.addedBy || isAdmin;
  const isVibingActive = playlist.nowVibing && playlist.nowVibing.length > 0;

  return (
    <>
      <div
        onClick={handleOpenCard}
        className="group relative bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 flex flex-col h-full"
      >
        {/* Cover Image Area */}
        <div className="relative w-full aspect-square bg-elevated overflow-hidden flex-shrink-0">
          <img 
            src={playlist.thumbnailUrl} 
            alt={playlist.title} 
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.innerHTML = '<div class="text-muted"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></div>';
              }
            }}
          />
          
          {/* Gradient Overlay for bottom atmosphere */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[60px]"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
          />

          {/* Vibe Tag Badge */}
          {playlist.vibeTag && (
            <div 
              className="absolute top-2 left-2 rounded-full px-2 py-1 text-xs text-white backdrop-blur-sm flex items-center gap-1 shadow-sm"
              style={{ background: `color-mix(in srgb, ${playlist.vibeTag.color} 80%, transparent)` }}
            >
              <span>{playlist.vibeTag.emoji}</span>
              <span className="font-medium tracking-wide">{playlist.vibeTag.label}</span>
            </div>
          )}

          {/* Now Vibing Badge */}
          {isVibingActive && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-full px-2 py-1 backdrop-blur-sm flex items-center gap-1.5 shadow-sm border border-border-subtle">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="font-medium">{playlist.nowVibing.length} vibing</span>
            </div>
          )}

          {/* Three Dot Menu on Cover Image */}
          <div className={`absolute ${isVibingActive ? 'bottom-2 right-2' : 'top-2 right-2'}`}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors border border-border-subtle opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div 
                className={`absolute right-0 w-48 bg-surface border border-border-subtle rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-20 ${isVibingActive ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <a
                  href={playlist.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-main hover:bg-base transition-colors border-b border-border-subtle"
                >
                  <ExternalLink size={16} /> Open in Spotify
                </a>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-main hover:bg-base transition-colors border-b border-border-subtle"
                >
                  <LinkIcon size={16} /> Copy Link
                </button>
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 size={16} /> Remove Playlist
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Info Section */}
        <div className="p-4 flex flex-col flex-1 bg-surface">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-base text-main truncate" title={playlist.title}>
              {playlist.title}
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-faint text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zM20.04 9.42c-3.96-2.34-10.44-2.58-14.28-1.44-.6.18-1.2-.12-1.38-.72-.18-.6.12-1.2.72-1.38 4.44-1.26 11.52-1.02 15.96 1.62.539.3.719 1.02.419 1.56-.239.54-.959.72-1.439.36z"/>
                </svg>
                <span>Spotify</span>
              </div>
              <span className="text-faint text-xs">{formatTimeAgo(playlist.addedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5">
            <div 
              className="w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold text-white text-[9px]"
              style={{ background: playlist.addedByAvatarColor }}
            >
              {playlist.addedByName.charAt(0).toUpperCase()}
            </div>
            <span className="text-faint text-xs truncate">by {playlist.addedByName}</span>
          </div>

          {playlist.description && (
            <p className="text-muted text-sm mt-2 line-clamp-2 leading-relaxed">
              {playlist.description}
            </p>
          )}

          <div className="mt-auto pt-3 pb-1 border-t border-border-subtle mt-3">
            {/* Reactions Row */}
            <div className="flex flex-wrap items-center gap-1 mb-2.5">
              {REACTIONS.map((r) => {
                const count = playlist.reactions?.[r.emoji]?.length || 0;
                const hasReacted = playlist.reactions?.[r.emoji]?.includes(user?.id || '');

                return (
                  <button
                    key={r.emoji}
                    onClick={(e) => handleToggleReaction(e, r.emoji)}
                    className="flex items-center gap-1 rounded-full font-medium text-sm transition-transform active:scale-95"
                    style={{
                      padding: '0.2rem 0.5rem',
                      background: hasReacted ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'var(--color-bg-base)',
                      border: hasReacted ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      color: hasReacted ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    <span>{r.emoji}</span>
                    {count > 0 && <span className="text-xs">{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Bottom Row: Rating & Comments */}
            <div className="flex justify-between items-center mt-1">
              <StarRating 
                ratings={playlist.ratings || {}} 
                currentUid={user?.id || ''} 
                size="sm" 
              />
              <button
                onClick={handleOpenComments}
                className="flex items-center gap-1.5 px-3 py-1 bg-elevated hover:bg-base text-main text-xs font-medium rounded-full border border-border-subtle transition-colors"
              >
                💬 Comments
              </button>
            </div>
          </div>

        </div>
      </div>

      {showDetailModal && (
        <PlaylistDetailModal
          playlist={playlist}
          onClose={() => setShowDetailModal(false)}
          initialTab={detailInitialTab}
          allUsers={allUsers}
        />
      )}
    </>
  );
};
