import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getDoc, updateDoc } from '../../lib/firestore';
import { formatTimeAgo } from '../../utils/date';
import { CommentSection } from './CommentSection';
import type { Post, User } from '../../types';
import { MessageCircle, Pin, MoreHorizontal, Trash2, Edit2, X, Loader2 } from 'lucide-react';
import { getAvatarColor } from '../../utils/avatarColor';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
}

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Lol' },
  { emoji: '😮', label: 'Grabe' },
  { emoji: '💀', label: 'Patay' },
  { emoji: '🔥', label: 'Fire' },
];

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuthStore();
  const { onlineUsers } = useOnlineUsers();
  const [author, setAuthor] = useState<User | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isUpdatingReaction, setIsUpdatingReaction] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { confirm } = useConfirm();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    let isMounted = true;
    const fetchAuthor = async () => {
      const u = await getDoc<User>('users', [post.authorId]);
      if (isMounted) setAuthor(u);
    };
    fetchAuthor();
    return () => { isMounted = false; };
  }, [post.authorId]);

  const isAdmin = user?.role === 'admin';
  const avatarBg = author ? getAvatarColor(author.displayName) : 'var(--color-primary)';
  const isAuthorOnline = onlineUsers.some(u => u.uid === post.authorId);

  const handleTogglePin = async () => {
    if (!isAdmin) return;

    try {
      if (!post.isPinned) {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        const q = query(collection(db, 'posts'), where('isPinned', '==', true));
        const snapshot = await getDocs(q);

        const unpinPromises = snapshot.docs.map(docSnap =>
          updateDoc('posts', [docSnap.id], { isPinned: false })
        );
        await Promise.all(unpinPromises);
      }

      await updateDoc('posts', [post.id], { isPinned: !post.isPinned });
    } catch (error) {
      console.error('Failed to toggle pin', error);
    }
  };

  const handleToggleReaction = async (emoji: string) => {
    if (!user || isUpdatingReaction) return;
    setIsUpdatingReaction(true);

    try {
      const newReactions = { ...post.reactions };

      Object.keys(newReactions).forEach(key => {
        newReactions[key] = newReactions[key].filter(uid => uid !== user.id);
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

  const handleDelete = async () => {
    setShowMenu(false);
    const isConfirmed = await confirm({
      title: 'Delete this post?',
      message: "This can't be undone.",
      isDanger: true,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      try {
        const { collection, query, getDocs, deleteDoc: firestoreDeleteDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');

        // Delete comments subcollection first
        const commentsRef = collection(db, 'posts', post.id, 'comments');
        const commentsSnap = await getDocs(query(commentsRef));
        const deletePromises = commentsSnap.docs.map(d => firestoreDeleteDoc(d.ref));
        await Promise.all(deletePromises);

        // Delete post document
        await firestoreDeleteDoc(doc(db, 'posts', post.id));
        toast.success('Post deleted.');
      } catch (error) {
        console.error('Error deleting post:', error);
        toast.error('Failed to delete post.');
      }
    }
  };

  const handleEditInit = () => {
    setShowMenu(false);
    setEditContent(post.content);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    if (editContent.trim() === post.content) {
      setIsEditing(false);
      return;
    }

    setIsSavingEdit(true);
    try {
      const historyEntry = { content: post.content, editedAt: Date.now() };
      const newHistory = post.editHistory ? [...post.editHistory, historyEntry] : [historyEntry];
      await updateDoc('posts', [post.id], { 
        content: editContent.trim(), 
        editHistory: newHistory 
      });
      setIsEditing(false);
      toast.success('Post updated');
    } catch (error) {
      console.error('Failed to update post:', error);
      toast.error('Failed to update post');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const canDelete = user?.id === post.authorId || isAdmin;
  const canEdit = user?.id === post.authorId;

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200"
      style={{
        background: 'var(--color-bg-surface)',
        border: post.isPinned
          ? '1px solid var(--color-primary)'
          : '1px solid var(--color-border-subtle)',
        boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar with hash color */}
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base flex-shrink-0"
              style={{ background: avatarBg }}
            >
              {author ? author.displayName.charAt(0).toUpperCase() : '?'}
            </div>
            {isAuthorOnline && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full animate-pulse z-10"
                style={{
                  background: 'var(--color-success)',
                  border: '2px solid var(--color-bg-surface)',
                }}
              />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-main text-sm">
                {author ? author.displayName : 'Loading...'}
              </h3>
              {post.isPinned && (
                <span
                  className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    color: 'var(--color-primary)',
                    background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                  }}
                >
                  <Pin size={10} /> Pinned
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-faint">
              <span>{formatTimeAgo(post.createdAt)}</span>
              {post.editHistory && post.editHistory.length > 0 && (
                <>
                  <span>&middot;</span>
                  <button 
                    onClick={() => setShowHistoryModal(true)}
                    className="hover:underline hover:text-main transition-colors font-medium cursor-pointer"
                  >
                    Edited
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center gap-1 relative z-10" ref={menuRef}>
          {isAdmin && (
            <button
              onClick={handleTogglePin}
              className={`p-2 rounded-full transition-colors ${
                post.isPinned ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted hover:bg-base'
              }`}
              title={post.isPinned ? 'Unpin post' : 'Pin post'}
            >
              <Pin size={16} />
            </button>
          )}

          {canDelete && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full text-muted hover:text-main hover:bg-surface transition-colors"
                title="Post options"
              >
                <MoreHorizontal size={16} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-surface border border-border-subtle rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
                  {canEdit && (
                    <button
                      onClick={handleEditInit}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-main hover:bg-base transition-colors border-b border-border-subtle"
                    >
                      <Edit2 size={16} />
                      Edit Post
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete Post
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {isEditing ? (
        <div className="mb-4 animate-in fade-in duration-200">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-base border border-primary/50 focus:border-primary rounded-xl px-4 py-3 text-main resize-none outline-none transition-colors"
            style={{ minHeight: '80px', fontSize: '1rem', lineHeight: '1.65' }}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 text-sm font-semibold text-muted hover:bg-base rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !editContent.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary text-sm font-bold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {isSavingEdit && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <p
          className="text-main whitespace-pre-wrap break-words mb-4"
          style={{ fontSize: '1rem', lineHeight: '1.65' }}
        >
          {post.content}
        </p>
      )}

      {/* Link Preview */}
      {post.linkMeta && (
        <div
          className="block mb-4 rounded-xl overflow-hidden group transition-colors"
          style={{
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-bg-base)',
          }}
        >
          {post.linkMeta.youtubeId ? (
            <div className="w-full relative pt-[56.25%]">
              <iframe
                src={`https://www.youtube.com/embed/${post.linkMeta.youtubeId}`}
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <a
              href={post.linkMeta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              {post.linkMeta.image && (
                <div className="w-full h-48 overflow-hidden bg-border-subtle">
                  <img
                    src={post.linkMeta.image}
                    alt="Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-4">
                <h4 className="text-sm font-semibold text-main truncate group-hover:text-primary transition-colors">
                  {post.linkMeta.title}
                </h4>
                <p className="text-xs text-muted line-clamp-2 mt-1">{post.linkMeta.description}</p>
                <p className="text-[10px] text-faint mt-2 uppercase tracking-wide truncate">
                  {new URL(post.linkMeta.url).hostname}
                </p>
              </div>
            </a>
          )}
        </div>
      )}

      {/* Reaction Bar — no visible divider, just spacing */}
      <div className="flex items-center justify-between mt-3 pt-1">
        {/* Reaction pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-wrap">
          {REACTIONS.map((r) => {
            const count = post.reactions?.[r.emoji]?.length || 0;
            const hasReacted = post.reactions?.[r.emoji]?.includes(user?.id || '');

            return (
              <button
                key={r.emoji}
                onClick={() => handleToggleReaction(r.emoji)}
                className="flex items-center gap-1.5 rounded-full font-medium text-sm transition-all duration-150 hover:scale-110 active:scale-95"
                style={{
                  minHeight: '36px',
                  padding: '0 0.75rem',
                  background: hasReacted
                    ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
                    : 'var(--color-bg-surface)',
                  border: hasReacted
                    ? '1px solid var(--color-primary)'
                    : '1px solid var(--color-border)',
                  color: hasReacted ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
                title={r.label}
              >
                <span>{r.emoji}</span>
                {count > 0 && (
                  <span
                    className="text-sm font-medium"
                    style={{ color: hasReacted ? 'var(--color-primary)' : 'var(--color-text-main)' }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Comments pill — right aligned */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 rounded-full font-medium text-sm transition-all duration-150 hover:scale-105 flex-shrink-0 ml-2"
          style={{
            minHeight: '36px',
            padding: '0 0.75rem',
            background: showComments
              ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
              : 'transparent',
            border: showComments
              ? '1px solid var(--color-primary)'
              : '1px solid var(--color-border)',
            color: showComments ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        >
          <MessageCircle size={15} />
          <span className="hidden sm:inline text-sm">Comments</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection postId={post.id} />
      )}

      {/* Edit History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold text-main flex items-center gap-2">
                <Edit2 size={18} className="text-primary" /> Edit History
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-full text-muted hover:bg-base transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              {/* Current Version */}
              <div className="relative pl-4 border-l-2 border-primary">
                <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Current Version</p>
                <p className="text-sm text-main whitespace-pre-wrap">{post.content}</p>
              </div>
              
              {/* Past Versions */}
              {[...(post.editHistory || [])].reverse().map((history, idx) => (
                <div key={idx} className="relative pl-4 border-l-2 border-border-subtle opacity-75 hover:opacity-100 transition-opacity">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-border" />
                  <p className="text-xs font-semibold text-muted mb-1">
                    {new Date(history.editedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                  <p className="text-sm text-main whitespace-pre-wrap">{history.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
