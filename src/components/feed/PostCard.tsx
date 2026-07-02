import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getDoc, updateDoc, addDoc } from '../../lib/firestore';
import { useUsers } from '../../hooks/useUsers';
import { formatTimeAgo } from '../../utils/date';
import { CommentSection } from './CommentSection';
import { MobileBottomSheet } from '../ui/MobileBottomSheet';
import { SharePostModal } from './SharePostModal';
import { WhoReactedModal } from './WhoReactedModal';
import { WhoSeenItModal } from './WhoSeenItModal';
import type { Post, User } from '../../types';
import { Pin, MoreHorizontal, Trash2, Edit2, X, Loader2, Play, Eye, Bookmark, Share2, ThumbsUp, MessageSquare } from 'lucide-react';
import { getAvatarColor } from '../../utils/avatarColor';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { ProgressiveImage } from '../ui/ProgressiveImage';

interface PostCardProps {
  post: Post;
  onOpenPost?: (post: Post) => void;
  allUsers?: User[];
}

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
];

const PostCardComponent: React.FC<PostCardProps> = ({ post, onOpenPost, allUsers }) => {
  const { user } = useAuthStore();
  const { users } = useUsers();
  const { onlineUsers } = useOnlineUsers();
  const [author, setAuthor] = useState<User | null>(null);
  const [optimisticReactions, setOptimisticReactions] = useState(post.reactions || {});
  const [sharedPost, setSharedPost] = useState<Post | null>(null);
  const [sharedPostAuthor, setSharedPostAuthor] = useState<User | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReactors, setShowReactors] = useState(false);
  const [showSeenBy, setShowSeenBy] = useState(false);
  const [hidePicker, setHidePicker] = useState(false);

  useEffect(() => {
    setOptimisticReactions(post.reactions || {});
  }, [post.reactions]);

  useEffect(() => {
    if (!post.sharedPostId) return;
    let isMounted = true;
    const fetchSharedPost = async () => {
      const sp = await getDoc<any>('posts', [post.sharedPostId!]);
      if (isMounted && sp) {
        if (sp.createdAt?.toMillis) sp.createdAt = sp.createdAt.toMillis();
        if (sp.editedAt?.toMillis) sp.editedAt = sp.editedAt.toMillis();
        if (sp.expiresAt?.toMillis) sp.expiresAt = sp.expiresAt.toMillis();
        setSharedPost(sp as Post);
        const spa = await getDoc<User>('users', [sp.authorId]);
        if (isMounted) setSharedPostAuthor(spa);
      }
    };
    fetchSharedPost();
    return () => { isMounted = false; };
  }, [post.sharedPostId]);

  const [showComments, setShowComments] = useState(false);
  const [isUpdatingReaction, setIsUpdatingReaction] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { confirm } = useConfirm();

  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [isExpiredLocally, setIsExpiredLocally] = useState(false);
  const [shouldUnmount, setShouldUnmount] = useState(false);
  const postRef = useRef(post);
  postRef.current = post;

  useEffect(() => {
    if (!post.expiresAt) return;
    const updateTimer = () => {
      const currentPost = postRef.current;
      const now = Date.now();
      const diff = currentPost.expiresAt! - now;
      if (diff <= 0) {
        setIsExpiredLocally(true);
        return;
      }
      setIsExpiringSoon(diff < 60 * 60 * 1000);
      
      if (user && user.id === currentPost.authorId) {
        if (diff <= 30 * 60 * 1000) {
          const notifiedKey = `expiry_notified_${currentPost.id}`;
          if (!localStorage.getItem(notifiedKey)) {
            localStorage.setItem(notifiedKey, 'true');
            import('../../lib/notifications').then(({ writeNotification }) => {
              writeNotification(user.id, {
                type: 'expiry',
                fromUid: 'system',
                fromName: 'System',
                fromAvatarColor: 'var(--color-bg-elevated)',
                postId: currentPost.id,
                message: `Your timed post is expiring in 30 minutes`,
                preview: (currentPost.content || '').trim().slice(0, 60),
              }, 'expiry');
            });
          }
        }
      }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      let str = '⏱️ ';
      if (d > 0) str += `${d}d ${h}h`;
      else if (h > 0) str += `${h}h ${m}m`;
      else str += `${m}m`;
      
      setTimeLeftStr(str);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [post.expiresAt]);

  useEffect(() => {
    if (isExpiredLocally) {
      const t = setTimeout(() => setShouldUnmount(true), 1000);
      return () => clearTimeout(t);
    }
  }, [isExpiredLocally]);

  const hasSeen = user && post.seenBy?.includes(user.id);

  useEffect(() => {
    if (!user || user.id === post.authorId) return;
    if (hasSeen || user.privacyPrefs?.showSeenBy === false) return;

    let timeout: ReturnType<typeof setTimeout>;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          timeout = setTimeout(() => {
            import('../../lib/debouncedWrites').then(({ queueSeenPost }) => {
              queueSeenPost(post.id, user.id);
            });
            observer.disconnect();
          }, 1000);
        } else {
          clearTimeout(timeout);
        }
      });
    }, { threshold: 0.5 });
    
    if (cardRef.current) observer.observe(cardRef.current);
    
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [user?.id, post.authorId, hasSeen, post.id]);

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

  const [commentCount, setCommentCount] = useState(0);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchAuthor = async () => {
      // First try to find from the passed allUsers (if available) or the global users hook cache
      const userList = (allUsers && allUsers.length > 0) ? allUsers : users;
      if (userList && userList.length > 0) {
        const u = userList.find(u => u.id === post.authorId);
        if (u) {
          if (isMounted) setAuthor(u);
          return;
        }
      }
      
      // Fallback if not found in cache
      const u = await getDoc<User>('users', [post.authorId]);
      if (isMounted) setAuthor(u);
    };
    fetchAuthor();
    
    // Fetch initial comment count without lingering real-time subscription
    const fetchCommentCount = async () => {
      try {
        const { collection, getCountFromServer } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        const snapshot = await getCountFromServer(collection(db, `posts/${post.id}/comments`));
        if (isMounted) setCommentCount(snapshot.data().count);
      } catch (err) {
        console.error('Failed to fetch comment count', err);
      }
    };
    fetchCommentCount();
    
    return () => { 
      isMounted = false; 
    };
  }, [post.authorId, post.id, allUsers, users]);

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
      const newReactions = { ...optimisticReactions };
      const prevReactions = { ...optimisticReactions };

      Object.keys(newReactions).forEach(key => {
        newReactions[key] = newReactions[key].filter(uid => uid !== user.id);
      });

      const hadReaction = optimisticReactions[emoji]?.includes(user.id);
      if (!hadReaction) {
        if (!newReactions[emoji]) newReactions[emoji] = [];
        newReactions[emoji].push(user.id);
        
        if (post.authorId !== user.id) {
          import('../../lib/notifications').then(({ writeNotification }) => {
            writeNotification(post.authorId, {
              type: 'reaction',
              fromUid: user.id,
              fromName: user.displayName,
              fromAvatarColor: user.accentColor || '#3b82f6',
              postId: post.id,
              message: `${user.displayName} reacted ${emoji} to your post`,
              preview: post.content.trim().slice(0, 60),
            }, 'reactions');
          });
        }
      }

      Object.keys(newReactions).forEach(key => {
        if (newReactions[key].length === 0) delete newReactions[key];
      });

      setOptimisticReactions(newReactions);
      try {
        await updateDoc('posts', [post.id], { reactions: newReactions });
        if (!hadReaction) {
          import('firebase/firestore').then(({ increment }) => {
            updateDoc('users', [user.id], { reactionCount: increment(1) }).catch(console.error);
          });
          
          // Botbot Auto-Reaction Trigger
          const totalReactions = Object.values(newReactions).reduce((sum, arr) => sum + arr.length, 0);
          if (totalReactions === 3 || totalReactions === 7) {
            import('../../hooks/useBotbotRateLimit').then(({ useBotbotRateLimit }) => {
              if (useBotbotRateLimit.getState().canReact()) {
                const botbotCommented = post.botbotCommented || [];
                if (!botbotCommented.includes(totalReactions)) {
                  useBotbotRateLimit.getState().setLastReactionTime(Date.now());
                  import('../../lib/botbotReactions').then(async ({ generateBotbotReaction }) => {
                    try {
                      const commentStr = await generateBotbotReaction(post, totalReactions);
                      const { arrayUnion, addDoc, collection } = await import('firebase/firestore');
                      const { db } = await import('../../lib/firebase');
                      
                      // Update post to mark threshold as commented
                      await updateDoc('posts', [post.id], {
                        botbotCommented: arrayUnion(totalReactions)
                      });
                      
                      // Add comment
                      await addDoc(collection(db, 'posts', post.id, 'comments'), {
                        authorId: 'botbot',
                        content: commentStr,
                        createdAt: Date.now()
                      });
                    } catch (e) {
                      console.error('Failed to generate Botbot reaction', e);
                    }
                  });
                }
              }
            });
          }
        }
      } catch (err) {
        setOptimisticReactions(prevReactions);
        toast.error('Failed to react. Try again.');
        throw err;
      }
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
      window.dispatchEvent(new CustomEvent('optimisticDeletePost', { detail: post.id }));
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
        window.dispatchEvent(new CustomEvent('optimisticRestorePost', { detail: post }));
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
        editHistory: newHistory,
        isEdited: true,
        editedAt: Date.now()
      });
      setIsEditing(false);
      toast.success('Post updated ✏️');
    } catch (error) {
      console.error('Failed to update post:', error);
      toast.error('Failed to update post');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const canDelete = user?.id === post.authorId || isAdmin;
  const canEdit = user?.id === post.authorId;

  const handleToggleBookmark = () => {
    if (!user) return;
    const isSaved = user.savedPosts?.includes(post.id);
    const newSaved = isSaved 
      ? (user.savedPosts || []).filter(id => id !== post.id)
      : [...(user.savedPosts || []), post.id];

    // Optimistic update
    useAuthStore.getState().setUser({ ...user, savedPosts: newSaved });
    
    // Fire and forget
    import('firebase/firestore').then(({ arrayUnion, arrayRemove }) => {
      updateDoc('users', [user.id], {
        savedPosts: isSaved ? arrayRemove(post.id) : arrayUnion(post.id)
      }).catch((err) => {
        console.error(err);
        useAuthStore.getState().setUser({ ...user, savedPosts: user.savedPosts });
      });
    });

    if (isSaved) {
      toast.success('Post unsaved');
    } else {
      toast.success('Post saved 🔖');
    }
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

  // Derive styles from new features
  const hasBg = !!post.bgColor;
  const textClass = hasBg ? 'text-white' : 'text-main';
  const faintTextClass = hasBg ? 'text-white/70' : 'text-faint';
  const mutedTextClass = hasBg ? 'text-white/80' : 'text-muted';

  if (shouldUnmount) return null;

  let seenByText = '';
  if (post.seenBy && post.seenBy.length > 0) {
    if (allUsers && allUsers.length > 1) {
      const totalMembersExcludingAuthor = allUsers.length - 1;
      if (post.seenBy.length >= totalMembersExcludingAuthor) {
        seenByText = '👁️ Seen by everyone';
      } else {
        seenByText = `👁️ Seen by ${post.seenBy.length}`;
      }
    } else {
      seenByText = `👁️ Seen by ${post.seenBy.length}`;
    }
  }

  const isTimed = !!post.expiresAt;

  return (
    <div
      ref={cardRef}
      className={`relative rounded-2xl p-5 transition-all duration-200 ${hasBg && onOpenPost ? 'cursor-pointer' : ''} ${isExpiredLocally ? 'opacity-0 duration-1000' : 'opacity-100'}`}
      style={{
        background: isTimed ? 'color-mix(in srgb, var(--color-warning) 3%, var(--color-bg-surface))' : (post.bgColor || 'var(--color-bg-surface)'),
        border: hasBg ? '1px solid transparent' : (isTimed ? '1px dashed color-mix(in srgb, var(--color-warning) 60%, transparent)' : '1px solid var(--color-border-subtle)'),
        borderLeft: post.isPinned && !hasBg ? '3px solid var(--color-primary)' : undefined,
        borderTop: post.isPinned && !hasBg ? '1px solid color-mix(in srgb, var(--color-primary) 40%, transparent)' : undefined,
        boxShadow: isHovered 
          ? 'var(--shadow-md)' 
          : post.isPinned && !hasBg 
            ? '0 0 0 1px color-mix(in srgb, var(--color-primary) 20%, transparent), var(--shadow-sm)'
            : 'var(--shadow-sm)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (hasBg && onOpenPost) {
          const target = e.target as HTMLElement;
          if (!target.closest('button') && !target.closest('a')) {
            onOpenPost(post);
          }
        }
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <Link to={`/profile/${author?.handle || post.authorId}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 group">
          {/* Avatar with hash color */}
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base flex-shrink-0 shadow-sm transition-transform group-hover:scale-105"
              style={{ background: author?.avatarUrl ? undefined : avatarBg }}
            >
              {author?.avatarUrl ? (
                <img src={author.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                author ? author.displayName.charAt(0).toUpperCase() : '?'
              )}
            </div>
            {isAuthorOnline && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full animate-pulse z-10"
                style={{
                  background: 'var(--color-success)',
                  border: `2px solid ${hasBg ? 'transparent' : 'var(--color-bg-surface)'}`,
                }}
              />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-semibold text-sm group-hover:underline ${textClass}`}>
                {author ? author.displayName : 'Loading...'}
              </h3>
              
              {post.isPinned && (
                <span
                  className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    color: hasBg ? '#fff' : 'var(--color-primary)',
                    background: hasBg ? 'rgba(255,255,255,0.2)' : 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                  }}
                >
                  <Pin size={10} /> Pinned
                </span>
              )}

              {/* Vibe Tag Badge */}
              {post.vibeTag && (
                <span 
                  className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    color: hasBg ? '#fff' : post.vibeTag.color,
                    background: hasBg ? 'rgba(255,255,255,0.2)' : `color-mix(in srgb, ${post.vibeTag.color} 15%, transparent)`,
                    border: hasBg ? '1px solid rgba(255,255,255,0.3)' : `1px solid color-mix(in srgb, ${post.vibeTag.color} 30%, transparent)`,
                  }}
                >
                  <span className="text-xs">{post.vibeTag.emoji}</span> {post.vibeTag.label}
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1.5 text-xs ${faintTextClass}`}>
              <span className="font-mono">{formatTimeAgo(post.createdAt)}</span>
              {isTimed && timeLeftStr && (
                <>
                  <span>&middot;</span>
                  <span 
                    className={`font-semibold ${isExpiringSoon ? 'text-danger animate-pulse' : 'text-warning'}`}
                  >
                    {timeLeftStr}
                  </span>
                </>
              )}
              {post.isEdited && post.editedAt && (
                <>
                  <span>&middot;</span>
                  <span 
                    className={`italic text-[10px] cursor-help`}
                    title={`Edited ${new Date(post.editedAt).toLocaleString()}`}
                  >
                    edited
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>
        
        <div className="absolute top-3 right-3 flex items-center gap-1 z-10" ref={menuRef}>
          {user && (
            <button
              onClick={handleToggleBookmark}
              className={`p-1 w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                hasBg ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-muted hover:bg-elevated'
              }`}
              title={user.savedPosts?.includes(post.id) ? "Unsave post" : "Save post"}
            >
              <Bookmark 
                size={16} 
                className={user.savedPosts?.includes(post.id) ? "fill-primary text-primary" : ""} 
                style={user.savedPosts?.includes(post.id) ? { color: 'var(--color-primary)' } : undefined} 
              />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleTogglePin}
              className={`p-2 w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                post.isPinned 
                  ? (hasBg ? 'text-white bg-white/20' : 'text-primary bg-primary/10 hover:bg-primary/20')
                  : (hasBg ? 'text-white/70 hover:bg-white/10' : 'text-muted hover:bg-elevated')
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
                className={`p-2 w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                  hasBg ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-muted hover:text-main hover:bg-elevated'
                }`}
                title="Post options"
              >
                <MoreHorizontal size={16} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-surface border border-border-subtle rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
                  <button
                    onClick={() => { setShowMenu(false); onOpenPost?.(post); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-main hover:bg-base transition-colors border-b border-border-subtle"
                  >
                    <Eye size={16} />
                    View Post
                  </button>
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
          className={`whitespace-pre-wrap break-words mb-4 ${textClass}`}
          style={{ fontSize: '1rem', lineHeight: '1.65' }}
        >
          {renderContentWithMentions(post.content, allUsers)}
        </p>
      )}

      {/* Nested Shared Post */}
      {post.sharedPostId && (
        <div 
          className="mb-4 rounded-xl p-4 border border-border-subtle cursor-pointer hover:bg-base transition-colors"
          style={{ background: 'color-mix(in srgb, var(--color-bg-base) 50%, transparent)' }}
          onClick={(e) => {
            e.stopPropagation();
            if (sharedPost && onOpenPost) onOpenPost(sharedPost);
          }}
        >
          {sharedPost ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] overflow-hidden"
                  style={{ background: sharedPostAuthor?.avatarUrl ? undefined : getAvatarColor(sharedPostAuthor?.displayName || '?') }}
                >
                  {sharedPostAuthor?.avatarUrl ? (
                    <img src={sharedPostAuthor.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    sharedPostAuthor?.displayName.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <span className="font-semibold text-sm text-main">{sharedPostAuthor?.displayName || 'Loading...'}</span>
                <span className="text-xs text-faint">&middot; {formatTimeAgo(sharedPost.createdAt)}</span>
              </div>
              <p className="text-sm text-main whitespace-pre-wrap break-words">
                {renderContentWithMentions(sharedPost.content, allUsers)}
              </p>
              {sharedPost.imageUrl && (
                <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                   🖼️ Attached Image
                </div>
              )}
              {sharedPost.linkMeta && (
                <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                   🔗 Attached Link
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-faint flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading shared post...
            </div>
          )}
        </div>
      )}

      {/* Nested Shared Reddit Post */}
      {post.sharedRedditPost && (
        <div 
          className="mb-4 rounded-xl border border-border-subtle overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
          style={{ background: 'color-mix(in srgb, var(--color-bg-surface) 90%, transparent)' }}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenPost) onOpenPost(post);
          }}
        >
          <div className="p-3 bg-surface border-b border-border-subtle flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0" style={{ background: '#FF4500' }}>
              <span className="text-[10px]">🤖</span>
            </div>
            <span className="font-semibold text-sm text-main">r/{post.sharedRedditPost.subreddit}</span>
            <span className="text-xs text-faint">&middot; u/{post.sharedRedditPost.author}</span>
          </div>
          <div className="p-3">
            <h4 className="font-semibold text-main text-sm mb-1">{post.sharedRedditPost.title}</h4>
            {post.sharedRedditPost.selftext && (
              <p className="text-sm text-muted whitespace-pre-wrap break-words">
                {post.sharedRedditPost.selftext}
              </p>
            )}
            {(post.sharedRedditPost.is_reddit_media_domain || post.sharedRedditPost.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i)) && (
              <div className="mt-3 w-full rounded-lg overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/5 border border-border-subtle">
                <ProgressiveImage 
                  src={post.sharedRedditPost.url} 
                  alt="Reddit media" 
                  className="w-full h-auto max-h-[700px] object-contain"
                />
              </div>
            )}
            {post.sharedRedditPost.is_video && (
              <div className="mt-3 relative w-full pt-[56.25%] bg-black rounded-lg border border-border-subtle overflow-hidden flex items-center justify-center group">
                {post.sharedRedditPost.thumbnail && post.sharedRedditPost.thumbnail.startsWith('http') && (
                  <img src={post.sharedRedditPost.thumbnail} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                    <span className="text-xl ml-1">▶</span>
                  </div>
                  <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">Video ↗</span>
                </div>
              </div>
            )}
            {!post.sharedRedditPost.is_reddit_media_domain && !post.sharedRedditPost.is_video && post.sharedRedditPost.url && !post.sharedRedditPost.url.includes('reddit.com/r/') && !post.sharedRedditPost.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
              <a 
                href={post.sharedRedditPost.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-3 flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-elevated transition-colors"
              >
                {post.sharedRedditPost.thumbnail && post.sharedRedditPost.thumbnail.startsWith('http') && (
                  <img src={post.sharedRedditPost.thumbnail} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-main truncate">{post.sharedRedditPost.title}</p>
                  <p className="text-xs text-muted truncate mt-0.5">{new URL(post.sharedRedditPost.url).hostname}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      )}



      {/* Image Attachment */}
      {post.imageUrl && !imageError && (
        <div className="mb-4">
          <div className="w-full rounded-lg overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/5">
            <ProgressiveImage 
              src={post.imageUrl} 
              alt="Post attachment" 
              className="w-full h-auto max-h-[700px] object-contain cursor-pointer hover:opacity-95"
              onClick={() => onOpenPost?.(post)}
              onError={() => setImageError(true)}
            />
          </div>
        </div>
      )}

      {/* Link Preview */}
      {post.linkMeta && (
        <div
          className="block mb-4 rounded-xl overflow-hidden group transition-colors"
          style={{
            border: hasBg ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--color-border-subtle)',
            background: hasBg ? 'rgba(0,0,0,0.2)' : 'var(--color-bg-base)',
          }}
        >
          {post.linkMeta.youtubeId ? (
            <div 
              className="w-full relative pt-[56.25%] bg-black group cursor-pointer"
              onClick={() => onOpenPost?.(post)}
            >
              <img 
                src={post.linkMeta.image || `https://img.youtube.com/vi/${post.linkMeta.youtubeId}/hqdefault.jpg`} 
                alt="Video thumbnail" 
                className="absolute top-0 left-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-primary transition-colors shadow-lg">
                   <Play className="text-white ml-1" size={32} />
                </div>
              </div>
            </div>
          ) : post.linkMeta.isFacebookVideo ? (
            <div 
              className="w-full relative pt-[100%] sm:pt-[56.25%] bg-black group cursor-pointer"
              onClick={() => onOpenPost?.(post)}
            >
              <img 
                src={post.linkMeta.image || 'https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_play_button_icon_%282013%E2%80%932017%29.svg'} // Using a generic play button placeholder if no image
                alt="Facebook video thumbnail" 
                className="absolute top-0 left-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-[#1877F2] transition-colors shadow-lg">
                   <Play className="text-white ml-1" size={32} />
                </div>
              </div>
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
                <h4 className={`text-sm font-semibold truncate transition-colors ${hasBg ? 'text-white group-hover:text-white/80' : 'text-main group-hover:text-primary'}`}>
                  {post.linkMeta.title}
                </h4>
                <p className={`text-xs line-clamp-2 mt-1 ${mutedTextClass}`}>{post.linkMeta.description}</p>
                <p className={`text-[10px] mt-2 uppercase tracking-wide truncate ${faintTextClass}`}>
                  {new URL(post.linkMeta.url).hostname}
                </p>
              </div>
            </a>
          )}
        </div>
      )}

      {/* Reaction Bar */}
      <div className="flex flex-col mt-3">
        {/* Top Row: Reaction Summary */}
        {(() => {
          const activeEmojis = REACTIONS.filter(r => (optimisticReactions?.[r.emoji]?.length || 0) > 0);
          const totalReactions = activeEmojis.reduce((sum, r) => sum + (optimisticReactions?.[r.emoji]?.length || 0), 0);
          
          if (totalReactions === 0 && commentCount === 0 && !seenByText) return null;

          return (
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setShowReactors(true); }}>
                {activeEmojis.length > 0 && (
                  <div className="flex -space-x-1">
                    {activeEmojis.slice(0, 3).map((r, idx) => (
                      <div 
                        key={r.emoji} 
                        className="w-5 h-5 rounded-full flex items-center justify-center border text-[10px] z-[3] shadow-sm relative" 
                        style={{ 
                          zIndex: 3 - idx, 
                          background: hasBg ? 'rgba(255,255,255,0.2)' : 'var(--color-bg-surface)',
                          borderColor: hasBg ? 'rgba(255,255,255,0.1)' : 'var(--color-border)'
                        }}
                      >
                        {r.emoji}
                      </div>
                    ))}
                  </div>
                )}
                {totalReactions > 0 && (
                  <span className="text-xs font-medium" style={{ color: hasBg ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)' }}>
                    {totalReactions}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {commentCount > 0 && (
                  <span className="text-xs cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }} style={{ color: hasBg ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)' }}>
                    {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                  </span>
                )}
                {seenByText && (
                  <span 
                    className={`text-xs cursor-pointer hover:underline hover:text-primary transition-colors ${faintTextClass}`} 
                    onClick={(e) => { e.stopPropagation(); setShowSeenBy(true); }}
                    style={{ color: hasBg ? 'rgba(255,255,255,0.6)' : undefined }}
                  >
                    {seenByText}
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Bottom Row: Action Buttons */}
        <div className="flex items-center justify-between border-t border-border-subtle pt-1 gap-1" style={{ borderColor: hasBg ? 'rgba(255,255,255,0.2)' : 'var(--color-border)' }}>
          {/* Like Button with Hover Menu */}
          <div className="relative group flex-1" onMouseLeave={() => setHidePicker(false)}>
            {/* Hover Menu with invisible bridge to prevent losing hover state */}
            <div className={`absolute bottom-full left-0 pb-2 hidden ${!hidePicker ? 'group-hover:block' : ''} z-50`}>
              <div className="flex items-center gap-1 border border-border-subtle rounded-full shadow-xl p-1 animate-in slide-in-from-bottom-2 fade-in duration-200" style={{ background: hasBg ? 'var(--color-bg-base)' : 'var(--color-bg-surface)' }}>
                {REACTIONS.map((r) => (
                  <button
                    key={r.emoji}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleToggleReaction(r.emoji); 
                      setHidePicker(true);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-xl hover:scale-125 transition-transform origin-bottom"
                    title={r.label}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const userReaction = REACTIONS.find(r => optimisticReactions?.[r.emoji]?.includes(user?.id || ''));
              return (
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleReaction(userReaction ? userReaction.emoji : '👍'); }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-base/50 transition-colors font-semibold text-sm"
                  style={{ color: userReaction ? 'var(--color-primary)' : (hasBg ? '#fff' : 'var(--color-text-muted)'), background: 'transparent' }}
                >
                  {userReaction ? <span className="text-lg leading-none mb-[2px]">{userReaction.emoji}</span> : <ThumbsUp size={18} strokeWidth={2.5} />}
                  <span>{userReaction ? userReaction.label : 'Like'}</span>
                </button>
              );
            })()}
          </div>

          {/* Comment Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-base/50 transition-colors font-semibold text-sm"
            style={{ color: hasBg ? '#fff' : 'var(--color-text-muted)', background: 'transparent' }}
          >
            <MessageSquare size={18} strokeWidth={2.5} />
            <span>Comment</span>
          </button>

          {/* Share Button */}
          <button
            onClick={(e) => { 
              e.stopPropagation();
              if (!user) { toast.error('You must be logged in to share.'); return; }
              setShowShareModal(true); 
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-base/50 transition-colors font-semibold text-sm"
            style={{ color: hasBg ? '#fff' : 'var(--color-text-muted)', background: 'transparent' }}
          >
            <Share2 size={18} strokeWidth={2.5} />
            <span>Share</span>
          </button>
        </div>
      </div>



      {/* Comments Section */}
      {showComments && (
        <div className={`mt-4 ${hasBg ? 'bg-black/20 p-4 rounded-xl' : ''}`}>
          <CommentSection postId={post.id} allUsers={allUsers} />
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <SharePostModal
          post={sharedPost || post}
          author={sharedPostAuthor || author}
          onClose={() => setShowShareModal(false)}
          onShare={async (caption) => {
            try {
              if (!user) return;
              const targetPostId = post.sharedPostId || post.id;
              
              const newPost = {
                authorId: user.id,
                content: caption.trim(),
                createdAt: Date.now(),
                sharedPostId: targetPostId,
                reactions: {},
                isPinned: false
              };
              
              await addDoc('posts', newPost as any);
              toast.success('Post shared to your feed!');
              
              const originalAuthorId = post.sharedPostId ? sharedPost?.authorId : post.authorId;
              if (originalAuthorId && originalAuthorId !== user.id) {
                import('../../lib/notifications').then(({ writeNotification }) => {
                  writeNotification(originalAuthorId, {
                    type: 'post',
                    fromUid: user.id,
                    fromName: user.displayName,
                    fromAvatarColor: user.accentColor || '#3b82f6',
                    postId: targetPostId,
                    message: `${user.displayName} shared your post`,
                    preview: caption.trim() ? caption.substring(0, 60) : 'Shared your post to their feed',
                  }, 'posts');
                });
              }
              setShowShareModal(false);
            } catch (err) {
              console.error(err);
              toast.error('Failed to share post.');
              throw err;
            }
          }}
        />
      )}

      {/* Edit History Modal */}
      {showHistoryModal && (
        isMobile ? (
          <MobileBottomSheet isOpen={true} onClose={() => setShowHistoryModal(false)} maxHeight="80vh">
            <div className="flex flex-col h-full w-full bg-base overflow-hidden relative" style={{ minHeight: '50vh' }}>
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <h2 className="text-lg font-heading font-bold text-main flex items-center gap-2">
                  <Edit2 size={18} className="text-primary" /> Edit History
                </h2>
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
          </MobileBottomSheet>
        ) : (
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
        )
      )}

      {showReactors && (
        <WhoReactedModal
          reactions={optimisticReactions || {}}
          onClose={() => setShowReactors(false)}
        />
      )}

      {showSeenBy && (
        <WhoSeenItModal
          seenBy={post.seenBy || []}
          postAuthorId={post.authorId}
          onClose={() => setShowSeenBy(false)}
        />
      )}
    </div>
  );
};


export const PostCard = React.memo(PostCardComponent, (prev, next) => {
  if (prev.post.id !== next.post.id) return false;
  if (prev.post.content !== next.post.content) return false;
  if (prev.post.isPinned !== next.post.isPinned) return false;
  if (prev.post.isEdited !== next.post.isEdited) return false;
  
  const prevComments = prev.post.comments ? Object.keys(prev.post.comments).length : 0;
  const nextComments = next.post.comments ? Object.keys(next.post.comments).length : 0;
  if (prevComments !== nextComments) return false;

  const prevSeenBy = prev.post.seenBy ? prev.post.seenBy.length : 0;
  const nextSeenBy = next.post.seenBy ? next.post.seenBy.length : 0;
  if (prevSeenBy !== nextSeenBy) return false;
  
  if (JSON.stringify(prev.post.reactions) !== JSON.stringify(next.post.reactions)) return false;
  
  return true;
});
