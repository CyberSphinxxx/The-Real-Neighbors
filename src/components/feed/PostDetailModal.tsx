import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuthStore } from '../../stores/authStore';
import { getDoc, updateDoc, subscribeToCollection, addDoc } from '../../lib/firestore';
import { formatTimeAgo } from '../../utils/date';
import { X, ChevronLeft, ChevronRight, Send, Loader2, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import type { User, Comment, Post } from '../../types';
import { useConfirm } from '../../contexts/ConfirmContext';
import { getAvatarColor } from '../../utils/avatarColor';
import { orderBy } from 'firebase/firestore';
import { ShareRedditPostModal } from './ShareRedditPostModal';

interface PostDetailModalProps {
  post: any;
  isRedditPost?: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  allUsers?: User[];
}

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
];

export const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, isRedditPost, onClose, onPrev, onNext, allUsers }) => {
  const { user } = useAuthStore();
  const { confirm } = useConfirm();
  const [author, setAuthor] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingReaction, setIsUpdatingReaction] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  const [isRedditPostShared, setIsRedditPostShared] = useState(false);
  const [isSharingFromModal, setIsSharingFromModal] = useState(false);
  const [showRedditShareModal, setShowRedditShareModal] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionCursorPos, setMentionCursorPos] = useState<number | null>(null);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  const filteredMentions = React.useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => u.displayName.toLowerCase().startsWith(mentionFilter.toLowerCase()));
  }, [allUsers, mentionFilter]);

  const insertMention = (userToMention: User) => {
    if (mentionCursorPos === null) return;
    const textBeforeMention = newComment.slice(0, mentionCursorPos - mentionFilter.length - 1);
    const textAfterMention = newComment.slice(mentionCursorPos);
    const newContent = `${textBeforeMention}@${userToMention.displayName} ${textAfterMention}`;
    setNewComment(newContent);
    setShowMentionPicker(false);
    
    setTimeout(() => {
      const input = inputRef.current;
      if (input) {
        input.focus();
        const newPos = textBeforeMention.length + userToMention.displayName.length + 2;
        input.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewComment(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos ?? undefined);
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

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommentSubmit();
    }
  };

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  // Fetch author
  useEffect(() => {
    if (isRedditPost) return;
    let isMounted = true;
    const fetchAuthor = async () => {
      const u = await getDoc<User>('users', [post.authorId]);
      if (isMounted) setAuthor(u);
    };
    fetchAuthor();
    return () => { isMounted = false; };
  }, [post.authorId, isRedditPost]);

  useEffect(() => {
    if (!isRedditPost) return;
    let isMounted = true;
    const checkShared = async () => {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        const q = query(collection(db, 'posts'), where('sharedRedditPost.id', '==', post.id));
        const snapshot = await getDocs(q);
        if (isMounted) {
          setIsRedditPostShared(!snapshot.empty);
        }
      } catch (err) {
        console.error('Failed to check shared status', err);
      }
    };
    checkShared();
    return () => { isMounted = false; };
  }, [post.id, isRedditPost]);

  const handleShareToFeedFromModal = async (caption: string) => {
    if (!user || isSharingFromModal) return;
    setIsSharingFromModal(true);
    try {
      const newPost: Omit<Post, 'id'> = {
        authorId: user.id,
        content: caption || '',
        createdAt: Date.now(),
        isPinned: false,
        reactions: {},
        comments: [],
        sharedRedditPost: post,
      };
      await addDoc('posts', newPost as any);
      import('react-hot-toast').then(({ default: toast }) => toast.success('Shared to feed!'));
      setIsRedditPostShared(true);
      setShowRedditShareModal(false);
    } catch (error) {
      console.error(error);
      import('react-hot-toast').then(({ default: toast }) => toast.error('Failed to share to feed.'));
    } finally {
      setIsSharingFromModal(false);
    }
  };

  const hasSeen = user && post.seenBy?.includes(user.id);

  // Real-time comments (wait, this is actually view tracking, not comments)
  useEffect(() => {
    if (isRedditPost || !user || user.id === post.authorId) return;
    if (hasSeen || user.privacyPrefs?.showSeenBy === false) return;
    const timeout = setTimeout(() => {
      import('firebase/firestore').then(({ arrayUnion }) => {
        updateDoc('posts', [post.id], { seenBy: arrayUnion(user.id) }).catch(console.error);
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [user?.id, post.authorId, hasSeen, post.id, isRedditPost]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Real-time comments
  useEffect(() => {
    const collectionPath = isRedditPost ? `redditPosts/${post.id}/comments` : `posts/${post.id}/comments`;
    const unsubscribe = subscribeToCollection<Comment>(
      collectionPath,
      (data) => {
        setComments(data);
        // auto-scroll to bottom on new comments
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      orderBy('createdAt', 'asc')
    );
    return () => unsubscribe();
  }, [post.id]);

  const handleToggleReaction = async (emoji: string) => {
    if (isRedditPost || !user || isUpdatingReaction) return;
    setIsUpdatingReaction(true);
    try {
      const newReactions = { ...post.reactions };
      Object.keys(newReactions).forEach(key => {
        newReactions[key] = newReactions[key].filter((uid: string) => uid !== user.id);
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
      if (!hadReaction) {
        import('firebase/firestore').then(({ increment }) => {
          updateDoc('users', [user.id], { reactionCount: increment(1) }).catch(console.error);
        });
      }
    } catch (error) {
      console.error('Failed to update reaction', error);
    } finally {
      setIsUpdatingReaction(false);
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
      const collectionPath = isRedditPost ? `redditPosts/${post.id}/comments` : `posts/${post.id}/comments`;
      await addDoc<Omit<Comment, 'id'>>(collectionPath, commentObj as any);
      import('firebase/firestore').then(({ increment }) => {
        updateDoc('users', [user.id], { commentCount: increment(1) }).catch(console.error);
      });
      setNewComment('');
      setShowMentionPicker(false);
    } catch (error) {
      console.error('Failed to post comment', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasBg = isRedditPost ? false : !!post.bgColor;
  const isImage = isRedditPost 
    ? post.is_reddit_media_domain || !!post.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i)
    : !!post.imageUrl;
  const isYoutube = isRedditPost ? false : !!post.linkMeta?.youtubeId;
  const isRedditVideo = isRedditPost && post.is_video;
  const isPlainText = !isImage && !isYoutube && !hasBg && !isRedditVideo;

  const totalReactionsCount = REACTIONS.reduce((acc, r) => acc + (post.reactions?.[r.emoji]?.length || 0), 0);
  const reactionSummary = REACTIONS.filter(r => (post.reactions?.[r.emoji]?.length || 0) > 0)
    .map(r => `${r.emoji} ${post.reactions?.[r.emoji]?.length}`)
    .join('  ');

  const avatarBg = author ? getAvatarColor(author.displayName) : 'var(--color-primary)';
  
  const isAdmin = user?.role === 'admin';
  const canDelete = !isRedditPost && (user?.id === post.authorId || isAdmin);
  const canEdit = !isRedditPost && user?.id === post.authorId;

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
        const commentsRef = collection(db, 'posts', post.id, 'comments');
        const commentsSnap = await getDocs(query(commentsRef));
        await Promise.all(commentsSnap.docs.map(d => firestoreDeleteDoc(d.ref)));
        await firestoreDeleteDoc(doc(db, 'posts', post.id));
        import('react-hot-toast').then(({ default: toast }) => toast.success('Post deleted.'));
        onClose();
      } catch (error) {
        console.error(error);
        import('react-hot-toast').then(({ default: toast }) => toast.error('Failed to delete post.'));
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
      import('react-hot-toast').then(({ default: toast }) => toast.success('Post updated ✏️'));
    } catch (error) {
      console.error(error);
      import('react-hot-toast').then(({ default: toast }) => toast.error('Failed to update post'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  let seenByText = '';
  let seenByNames = '';
  if (!isRedditPost && post.seenBy && post.seenBy.length > 0) {
    if (allUsers && allUsers.length > 1) {
      const totalMembersExcludingAuthor = allUsers.length - 1;
      if (post.seenBy.length >= totalMembersExcludingAuthor) {
        seenByText = '👁️ Seen by everyone';
      } else {
        seenByText = `👁️ Seen by ${post.seenBy.length}`;
      }
      seenByNames = post.seenBy.map((uid: string) => allUsers.find(u => u.id === uid)?.displayName || 'Unknown').join(', ');
    } else {
      seenByText = `👁️ Seen by ${post.seenBy.length}`;
    }
  }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative w-full h-full md:max-w-7xl md:h-[90vh] md:rounded-xl overflow-hidden flex flex-col md:flex-row shadow-2xl bg-black animate-in zoom-in-95 duration-200 z-10">
        
        {/* LEFT PANEL */}
        <div 
          className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
          style={{ 
            background: hasBg ? post.bgColor : (isPlainText ? 'var(--color-bg-surface)' : '#000'),
            maxHeight: '100%',
          }}
          onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}
        >
          {isImage && (
            <img 
              src={isRedditPost ? post.url : post.imageUrl!} 
              alt="Post" 
              className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-200"
            />
          )}

          {isRedditVideo && (
             <div className="w-full h-full relative flex items-center justify-center bg-black">
                <iframe
                  src={`https://www.redditmedia.com/mediaembed/${post.id.replace('t3_', '')}`}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  scrolling="no"
                  allowFullScreen
                  title="Reddit Video Player"
                />
             </div>
          )}

          {isYoutube && (
            <div className="w-full max-w-4xl p-4 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <div className="w-full relative pt-[56.25%] bg-black rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${post.linkMeta!.youtubeId}?autoplay=0&controls=1&rel=0`}
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="text-white px-2">
                <h3 className="font-semibold text-lg">{post.linkMeta!.title}</h3>
                <p className="text-white/70 text-sm mt-1">{post.linkMeta!.description}</p>
              </div>
            </div>
          )}

          {hasBg && !isImage && !isYoutube && (
            <div className="text-center p-8 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
              <p className="text-white text-3xl md:text-4xl font-heading font-bold max-w-[480px] break-words" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                {renderContentWithMentions(post.content, allUsers)}
              </p>
              {post.vibeTag && (
                <div className="mt-6">
                  <span className="px-3 py-1.5 rounded-full bg-white/20 border border-border-subtle text-white text-sm font-bold tracking-wide flex items-center gap-2">
                    <span>{post.vibeTag.emoji}</span> {post.vibeTag.label}
                  </span>
                </div>
              )}
            </div>
          )}

          {isPlainText && (
            <div className="w-full h-full p-8 flex flex-col justify-center max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
              {isRedditPost ? (
                <>
                  <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noreferrer" className="inline-block w-max px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-6" style={{ background: 'rgba(255, 69, 0, 0.15)', color: '#FF4500', border: '1px solid rgba(255, 69, 0, 0.3)' }}>
                    Reddit ↗
                  </a>
                  <h3 className="font-heading font-bold text-3xl text-main mb-4">{post.title}</h3>
                  {post.selftext && (
                    <p className="text-lg text-muted whitespace-pre-wrap break-words overflow-y-auto max-h-[50vh] custom-scrollbar pr-4">
                      {post.selftext}
                    </p>
                  )}
                  <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noreferrer" className="text-primary text-sm font-medium mt-6 inline-block hover:underline">
                    View original on Reddit ↗
                  </a>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-sm"
                  style={{ background: author?.avatarUrl ? undefined : avatarBg }}
                >
                  {author?.avatarUrl ? (
                    <img src={author.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    author ? author.displayName.charAt(0).toUpperCase() : '?'
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-main text-lg">{author ? author.displayName : 'Loading...'}</h3>
                  <p className="text-muted text-sm">{formatTimeAgo(post.createdAt)}</p>
                </div>
              </div>
              <p className="text-xl md:text-2xl text-main whitespace-pre-wrap break-words leading-relaxed">
                {renderContentWithMentions(post.content, allUsers)}
              </p>
              {post.vibeTag && (
                <div className="mt-6">
                  <span 
                    className="px-3 py-1.5 rounded-full text-sm font-bold tracking-wide flex items-center gap-2 w-max"
                    style={{
                      color: post.vibeTag.color,
                      background: `color-mix(in srgb, ${post.vibeTag.color} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${post.vibeTag.color} 30%, transparent)`,
                    }}
                  >
                    <span>{post.vibeTag.emoji}</span> {post.vibeTag.label}
                  </span>
                </div>
              )}

              {post.sharedRedditPost && (
                <div className="mt-8 bg-surface rounded-xl border border-border-subtle overflow-hidden w-full text-left">
                  <div className="p-3 bg-surface border-b border-border-subtle flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0" style={{ background: '#FF4500' }}>
                        <span className="text-[12px]">🤖</span>
                      </div>
                      <span className="font-semibold text-sm text-main truncate">r/{post.sharedRedditPost.subreddit}</span>
                      <span className="text-xs text-faint truncate">&middot; u/{post.sharedRedditPost.author}</span>
                    </div>
                    <a 
                      href={`https://reddit.com${post.sharedRedditPost.permalink}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors hover:opacity-80"
                      style={{ background: 'rgba(255, 69, 0, 0.15)', color: '#FF4500', border: '1px solid rgba(255, 69, 0, 0.3)' }}
                    >
                      Reddit ↗
                    </a>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-main text-base mb-2 leading-snug">{post.sharedRedditPost.title}</h4>
                    {post.sharedRedditPost.selftext && (
                      <p className="text-sm text-muted whitespace-pre-wrap break-words overflow-y-auto max-h-[30vh] custom-scrollbar">
                        {post.sharedRedditPost.selftext}
                      </p>
                    )}
                    {(post.sharedRedditPost.is_reddit_media_domain || post.sharedRedditPost.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i)) && (
                      <div className="mt-4 rounded-lg overflow-hidden bg-elevated">
                        <img 
                          src={post.sharedRedditPost.url} 
                          alt="Reddit media" 
                          className="w-full h-auto object-contain max-h-[40vh]"
                        />
                      </div>
                    )}
                    {post.sharedRedditPost.is_video && (
                       <div className="mt-4 w-full pt-[56.25%] relative bg-black rounded-lg overflow-hidden border border-border-subtle">
                         {post.sharedRedditPost.thumbnail && post.sharedRedditPost.thumbnail.startsWith('http') && (
                           <img src={post.sharedRedditPost.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                         )}
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-4xl mb-2">🎬</span>
                           <a href={`https://reddit.com${post.sharedRedditPost.permalink}`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-semibold transition-colors backdrop-blur">
                             Watch on Reddit ↗
                           </a>
                         </div>
                       </div>
                    )}
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          )}
          {/* Left Nav Arrow — inside left panel */}
          {onPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all z-20 backdrop-blur-md hidden md:flex items-center justify-center shadow-lg"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {/* Right Nav Arrow — inside left panel on the right edge */}
          {onNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all z-20 backdrop-blur-md hidden md:flex items-center justify-center shadow-lg"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        {/* RIGHT PANEL (Comments) */}
        <div 
          className="w-full md:w-[360px] h-full flex flex-col flex-shrink-0"
          style={{ background: 'var(--color-bg-surface)', borderLeft: '1px solid var(--color-border)' }}
        >
          {/* Right Panel Header: Author row + close button */}
          <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            {isRedditPost ? (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm flex-shrink-0" style={{ background: '#FF4500' }}>🤖</div>
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-main text-sm leading-tight truncate">r/{post.subreddit}</p>
                  <p className="text-faint text-xs truncate">u/{post.author} &middot; {formatTimeAgo(post.created_utc * 1000)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm flex-shrink-0"
                  style={{ background: author?.avatarUrl ? undefined : avatarBg }}
                >
                  {author?.avatarUrl ? (
                    <img src={author.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    author ? author.displayName.charAt(0).toUpperCase() : '?'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-main text-sm leading-tight">{author ? author.displayName : 'Loading...'}</p>
                    {post.vibeTag && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          color: post.vibeTag.color,
                          background: `color-mix(in srgb, ${post.vibeTag.color} 15%, transparent)`,
                        }}
                      >
                        {post.vibeTag.emoji} {post.vibeTag.label}
                      </span>
                    )}
                  </div>
                  <p className="text-faint text-xs flex items-center">
                    {formatTimeAgo(post.createdAt)}
                    {post.isEdited && post.editedAt && (
                      <>
                        <span className="mx-1">&middot;</span>
                        <span className="italic text-[10px] cursor-help" title={`Edited ${new Date(post.editedAt).toLocaleString()}`}>edited</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1">
              {canDelete && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-main hover:bg-base transition-colors"
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
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full text-muted hover:text-main transition-colors flex-shrink-0"
                style={{ background: 'var(--color-bg-base)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-base)')}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Top Section (post content + reactions) */}
          <div className="p-4 flex-shrink-0 border-b border-border-subtle">
            {isRedditPost ? (
              <>
                <div className="mb-4">
                  <h4 className="font-semibold text-main text-sm mb-1">{post.title}</h4>
                  {post.selftext && (
                     <p className="text-sm text-muted whitespace-pre-wrap break-words line-clamp-4 hover:line-clamp-none cursor-pointer">
                       {post.selftext}
                     </p>
                  )}
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-border-subtle">
                  <div className="flex items-center gap-1.5 text-muted text-xs font-medium" title="Reddit Upvotes">
                    <span>⬆️</span>
                    <span>{post.score > 999 ? (post.score / 1000).toFixed(1) + 'k' : post.score}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted text-xs font-medium" title="Reddit Comments">
                    <span>💬</span>
                    <span>{post.num_comments > 999 ? (post.num_comments / 1000).toFixed(1) + 'k' : post.num_comments}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Author info (visible on mobile only, hidden on md since header shows it) */}
                <div className="flex items-center gap-3 mb-3 md:hidden">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm"
                    style={{ background: author?.avatarUrl ? undefined : avatarBg }}
                  >
                    {author?.avatarUrl ? (
                      <img src={author.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      author ? author.displayName.charAt(0).toUpperCase() : '?'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-main text-sm truncate">{author ? author.displayName : 'Loading...'}</h3>
                      {post.vibeTag && !isPlainText && (
                        <span 
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                          style={{
                            color: post.vibeTag.color,
                            background: `color-mix(in srgb, ${post.vibeTag.color} 15%, transparent)`,
                          }}
                        >
                          {post.vibeTag.emoji} {post.vibeTag.label}
                        </span>
                      )}
                    </div>
                    <p className="text-muted text-xs flex items-center">
                      {formatTimeAgo(post.createdAt)}
                      {post.isEdited && post.editedAt && (
                        <>
                          <span className="mx-1">&middot;</span>
                          <span className="italic text-[10px] cursor-help" title={`Edited ${new Date(post.editedAt).toLocaleString()}`}>edited</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mb-4 animate-in fade-in duration-200">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-base border border-primary/50 focus:border-primary rounded-xl px-3 py-2 text-main resize-none outline-none transition-colors text-sm"
                      style={{ minHeight: '80px', lineHeight: '1.5' }}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1 text-xs font-semibold text-muted hover:bg-base rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={isSavingEdit || !editContent.trim()}
                        className="flex items-center gap-1 px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                      >
                        {isSavingEdit && <Loader2 size={12} className="animate-spin" />}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  post.content && !isPlainText && !hasBg && (
                    <p className="text-sm text-main whitespace-pre-wrap break-words mb-4 line-clamp-4 hover:line-clamp-none cursor-pointer">
                      {renderContentWithMentions(post.content, allUsers)}
                    </p>
                  )
                )}

                {(!isRedditPost || isRedditPostShared) && (
                  <>
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 flex-wrap mt-2">
                      {REACTIONS.map((r) => {
                        const reactors = post.reactions?.[r.emoji] || [];
                        const count = reactors.length;
                        const hasReacted = reactors.includes(user?.id || '');

                        let reactorNamesString = '';
                        if (count > 0 && allUsers) {
                          const names = reactors.map((uid: string) => {
                            const reactorUser = allUsers.find(u => u.id === uid);
                            if (reactorUser?.privacyPrefs?.showReactions === false && reactorUser.id !== user?.id) {
                              return 'Someone';
                            }
                            return reactorUser?.displayName || 'Unknown';
                          });
                          if (names.length > 3) {
                            reactorNamesString = `${names.slice(0, 3).join(', ')} + ${names.length - 3} more`;
                          } else {
                            reactorNamesString = names.join(', ');
                          }
                        }

                        return (
                          <Tooltip
                            key={r.emoji}
                            disabled={count === 0}
                            content={
                              <>
                                <div className="text-lg mb-1 leading-none">{r.emoji}</div>
                                <div className="whitespace-pre-wrap">{reactorNamesString}</div>
                              </>
                            }
                          >
                            <button
                              onClick={() => handleToggleReaction(r.emoji)}
                              className="flex items-center gap-1 rounded-full font-medium text-xs transition-transform active:scale-95"
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: hasReacted ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'var(--color-bg-base)',
                                border: hasReacted ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                color: hasReacted ? 'var(--color-primary)' : 'var(--color-text-muted)',
                              }}
                            >
                              <span>{r.emoji}</span>
                            </button>
                          </Tooltip>
                        );
                      })}
                    </div>
                    
                    {totalReactionsCount > 0 && (
                      <p className="text-xs text-muted mt-2 font-medium">
                        {reactionSummary}
                      </p>
                    )}
                    <div className="min-h-[24px]">
                      {seenByText && (
                        <div className={`text-xs text-right pt-2 text-faint cursor-help`} title={seenByNames}>
                          {seenByText}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-muted mb-2 sticky top-0 bg-surface z-10 py-1">
              {isRedditPost ? 'Friends Comments' : 'Comments'}
            </h4>
            {comments.length === 0 ? (
              <p className="text-center text-sm text-faint my-auto">
                {isRedditPost && !isRedditPostShared 
                  ? 'Comments are locked until this is shared.' 
                  : 'No comments yet. Say something! 💬'}
              </p>
            ) : (
              comments.map(comment => (
                <ModalCommentItem key={comment.id} comment={comment} allUsers={allUsers} />
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment Input */}
          <div className="p-3 border-t border-border flex items-end gap-2 bg-surface">
            {isRedditPost && !isRedditPostShared ? (
              <div className="w-full text-center py-4 flex flex-col items-center">
                <p className="text-sm text-main font-medium mb-1">Share to Unlock Comments</p>
                <p className="text-xs text-muted mb-4 max-w-[250px]">You must share this to the feed before anyone can comment on or react to it.</p>
                <button
                  onClick={() => setShowRedditShareModal(true)}
                  disabled={isSharingFromModal}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover transition-colors text-on-primary rounded-full text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSharingFromModal ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Share to Feed
                </button>
              </div>
            ) : (
              <>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm flex-shrink-0 mb-0.5"
                  style={{ background: user?.avatarUrl ? undefined : (user ? getAvatarColor(user.displayName) : 'var(--color-primary)') }}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    user?.displayName?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 relative">
                  {showMentionPicker && filteredMentions.length > 0 && (
                    <div 
                      className="absolute bottom-full mb-2 left-0 z-50 rounded-xl shadow-lg border max-h-[150px] overflow-y-auto custom-scrollbar"
                      style={{
                        background: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border-border-subtle)',
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
                          <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[9px] shadow-sm flex-shrink-0 bg-primary">
                            {mu.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-main">{mu.displayName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={newComment}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Write a comment..."
                    className="w-full bg-elevated border border-border-subtle rounded-full pl-4 pr-10 py-2 text-sm text-main placeholder:text-muted focus:border-primary outline-none"
                  />
                  <button
                    onClick={() => handleCommentSubmit()}
                    disabled={!newComment.trim() || isSubmitting}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-primary disabled:opacity-50 disabled:text-muted transition-colors hover:bg-primary/10"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {showRedditShareModal && isRedditPost && (
        <ShareRedditPostModal
          post={post}
          onClose={() => setShowRedditShareModal(false)}
          onShare={handleShareToFeedFromModal}
        />
      )}
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
          <img src={author.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          author ? author.displayName.charAt(0).toUpperCase() : '?'
        )}
      </div>
      <div className="flex-1 min-w-0 bg-base rounded-2xl rounded-tl-sm px-3 py-2">
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
