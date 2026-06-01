import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { updateDoc, subscribeToCollection } from '../lib/firestore';
import { where, orderBy } from 'firebase/firestore';
import { LogOut, Palette, Moon, Monitor, EyeOff, Loader2, Edit2, Tv, CheckCircle, Clock, ChevronRight, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useConfirm } from '../contexts/ConfirmContext';
import { getAvatarColor } from '../utils/avatarColor';
import type { Post, WatchlistEntry, User } from '../types';
import { PostCard } from '../components/feed/PostCard';
import { PostDetailModal } from '../components/feed/PostDetailModal';
import { Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'watchlist' | 'settings' | 'saved'>('posts');
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Data State
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myWatchlist, setMyWatchlist] = useState<WatchlistEntry[]>([]);
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);

  useEffect(() => {
    import('firebase/firestore').then(({ collection, getDocs }) => {
      import('../lib/firebase').then(({ db }) => {
        getDocs(collection(db, 'users')).then(snap => {
          setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as User));
        });
      });
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'saved' && user?.savedPosts && user.savedPosts.length > 0) {
      const fetchSavedPosts = async () => {
        const { collection, getDocs, query, where, documentId } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        
        const posts: Post[] = [];
        const savedIds = user.savedPosts || [];
        
        for (let i = 0; i < savedIds.length; i += 10) {
          const chunk = savedIds.slice(i, i + 10);
          const q = query(collection(db, 'posts'), where(documentId(), 'in', chunk));
          const snap = await getDocs(q);
          snap.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() } as Post);
          });
        }
        
        posts.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
        setSavedPosts(posts);
      };
      fetchSavedPosts();
    }
  }, [activeTab, user?.savedPosts]);

  const handlePrev = () => {
    if (!openPost) return;
    const idx = myPosts.findIndex(p => p.id === openPost.id);
    if (idx > 0) setOpenPost(myPosts[idx - 1]);
  };

  const handleNext = () => {
    if (!openPost) return;
    const idx = myPosts.findIndex(p => p.id === openPost.id);
    if (idx !== -1 && idx < myPosts.length - 1) setOpenPost(myPosts[idx + 1]);
  };
  
  // Settings State
  const [theme, setTheme] = useState<'default' | 'dark' | 'amoled'>('default');
  const [showAge, setShowAge] = useState(true);
  
  const { confirm } = useConfirm();

  useEffect(() => {
    if (user) {
      // Avoid calling setState in effect if possible, but safe here with correct deps or skipping it.
      // Alternatively, we just read from user object directly in UI.
      const savedTheme = localStorage.getItem('theme') || 'default';
      setTheme(savedTheme as any);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubPosts = subscribeToCollection<Post>(
      'posts', 
      (data) => setMyPosts(data),
      where('authorId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    
    const unsubWatchlist = subscribeToCollection<WatchlistEntry>(
      'watchlists',
      (data) => setMyWatchlist(data),
      where('userId', '==', user.id)
    );

    return () => {
      unsubPosts();
      unsubWatchlist();
    };
  }, [user]);

  const stats = useMemo(() => {
    return myWatchlist.reduce((acc, curr) => {
      if (curr.status === 'watching') acc.watching++;
      else if (curr.status === 'finished') acc.finished++;
      else if (curr.status === 'planned') acc.planned++;
      return acc;
    }, { watching: 0, finished: 0, planned: 0 });
  }, [myWatchlist]);

  const handleEditInit = () => {
    if (!user) return;
    setEditName(user.displayName);
    setEditColor(user.accentColor || '#3b82f6');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user || !editName.trim()) return;
    setIsSaving(true);
    try {
      await updateDoc('users', [user.id], {
        displayName: editName.trim(),
        accentColor: editColor,
      });
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: 'default' | 'dark' | 'amoled') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.remove('dark', 'amoled');
    if (newTheme !== 'default') {
      document.documentElement.classList.add(newTheme);
    }
  };

  const handleToggleAge = async () => {
    if (!user) return;
    const newValue = !showAge;
    setShowAge(newValue);
    try {
      await updateDoc('users', [user.id], { showAge: newValue });
    } catch (err) {
      console.error(err);
      setShowAge(!newValue); // revert
      toast.error('Failed to update privacy settings');
    }
  };

  const handleToggleNotificationPref = async (key: string, currentValue: boolean) => {
    if (!user) return;
    const currentPrefs = user.notificationPrefs || {};
    // Default is true if not set
    const newValue = currentValue === undefined ? false : !currentValue;
    
    const newPrefs = { ...currentPrefs, [key]: newValue };
    
    // Optimistic update
    useAuthStore.getState().setUser({ ...user, notificationPrefs: newPrefs });
    
    try {
      await updateDoc('users', [user.id], { notificationPrefs: newPrefs });
    } catch (err) {
      console.error(err);
      // Revert on fail
      useAuthStore.getState().setUser({ ...user, notificationPrefs: currentPrefs });
      toast.error('Failed to update notification settings');
    }
  };

  const handleSignOut = async () => {
    const isConfirmed = await confirm({
      title: 'Sign out?',
      message: 'Are you sure you want to sign out?',
      isDanger: true,
      confirmText: 'Sign Out'
    });
    if (isConfirmed) {
      signOut(auth);
    }
  };

  if (!user) return null;

  const joinedDate = new Date(user.joinedAt || Date.now());
  const daysAgo = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Profile Header Card */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border-subtle relative overflow-hidden">
        {/* Subtle accent color top bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1" 
          style={{ background: user.accentColor || 'var(--color-primary)' }} 
        />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-sm flex-shrink-0"
            style={{ background: getAvatarColor(user.displayName) }}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full rounded-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              user.displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info & Edit */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            {isEditing ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-base border border-border-subtle rounded-xl px-3 py-1.5 text-main focus:border-primary outline-none font-heading font-bold text-lg"
                    placeholder="Display Name"
                  />
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <label className="text-sm font-semibold text-main flex items-center gap-2">
                    <Palette size={16} /> Accent:
                  </label>
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-sm font-semibold text-muted hover:bg-base rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving || !editName.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary text-sm font-bold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-heading font-bold text-main truncate">
                  {user.displayName}
                </h1>
                <p className="text-sm text-muted mb-2 truncate">{user.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
                    style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}
                  >
                    {user.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                  <span className="text-xs text-faint font-medium">
                    Joined {daysAgo === 0 ? 'today' : `${daysAgo} days ago`}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Edit Button Toggle */}
          {!isEditing && (
            <button 
              onClick={handleEditInit}
              className="mt-2 sm:mt-0 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors border border-border-subtle hover:bg-base text-main"
            >
              <Edit2 size={15} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 p-1 bg-surface border border-border-subtle rounded-xl overflow-x-auto custom-scrollbar">
        {[
          { id: 'posts', label: `My Posts (${myPosts.length})` },
          { id: 'watchlist', label: 'Watchlist' },
          { id: 'settings', label: 'Settings' },
          { id: 'saved', label: `🔖 Saved (${user.savedPosts?.length || 0})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-muted hover:text-main hover:bg-base'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* MY POSTS TAB */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {myPosts.length === 0 ? (
              <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle">
                <p className="text-muted font-medium">You haven't posted anything yet. 👀</p>
              </div>
            ) : (
              myPosts.map(post => (
                <PostCard key={post.id} post={post} onOpenPost={setOpenPost} allUsers={allUsers} />
              ))
            )}
          </div>
        )}

        {/* SAVED TAB */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {(!user.savedPosts || user.savedPosts.length === 0) ? (
              <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle flex flex-col items-center justify-center">
                <span className="text-4xl mb-4">🔖</span>
                <p className="text-main font-bold">No saved posts yet.</p>
                <p className="text-muted text-sm mt-1">Bookmark posts from the feed to find them here.</p>
              </div>
            ) : (
              savedPosts.map(post => (
                <PostCard key={post.id} post={post} onOpenPost={setOpenPost} allUsers={allUsers} />
              ))
            )}
          </div>
        )}

        {/* WATCHLIST TAB */}
        {activeTab === 'watchlist' && (
          <div className="bg-surface rounded-2xl border border-border-subtle p-5 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-base border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <Tv size={20} className="text-primary mb-1" />
                <span className="text-xl font-bold text-main">{stats.watching}</span>
                <span className="text-[10px] uppercase text-muted font-semibold tracking-wider">Watching</span>
              </div>
              <div className="bg-base border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <CheckCircle size={20} className="text-emerald-500 mb-1" />
                <span className="text-xl font-bold text-main">{stats.finished}</span>
                <span className="text-[10px] uppercase text-muted font-semibold tracking-wider">Finished</span>
              </div>
              <div className="bg-base border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <Clock size={20} className="text-amber-500 mb-1" />
                <span className="text-xl font-bold text-main">{stats.planned}</span>
                <span className="text-[10px] uppercase text-muted font-semibold tracking-wider">Planned</span>
              </div>
            </div>

            {/* Condensed List */}
            <div className="space-y-2">
              {myWatchlist.slice(0, 5).map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-base border border-border">
                  <span className="font-semibold text-sm text-main truncate pr-2">{entry.title}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-surface border border-border-subtle text-muted flex-shrink-0">
                    {entry.status}
                  </span>
                </div>
              ))}
              {myWatchlist.length === 0 && (
                <p className="text-center text-sm text-muted py-4">Your watchlist is empty.</p>
              )}
            </div>

            <Link 
              to="/watchlist"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-base border border-border-subtle text-sm font-semibold text-main hover:bg-surface hover:text-primary transition-colors"
            >
              View full watchlist <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Appearance */}
            <div className="bg-surface rounded-2xl border border-border-subtle p-5">
              <h3 className="font-heading font-bold text-main mb-4 flex items-center gap-2">
                <Monitor size={18} className="text-primary" /> Appearance
              </h3>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleThemeChange('default')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border font-bold transition-all ${
                      theme === 'default' ? 'border-primary bg-primary/5 text-primary' : 'border-border-subtle text-muted hover:border-border hover:text-main'
                    }`}
                  >
                    <Monitor size={16} /> Light
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border font-bold transition-all ${
                      theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-border-subtle text-muted hover:border-border hover:text-main'
                    }`}
                  >
                    <Moon size={16} /> Dark
                  </button>
                  <button
                    onClick={() => handleThemeChange('amoled')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border font-bold transition-all bg-black ${
                      theme === 'amoled' ? 'border-primary text-primary' : 'border-border-subtle text-white/70 hover:border-border hover:text-white'
                    }`}
                  >
                    AMOLED
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                  <div>
                    <label className="text-sm font-semibold text-main flex items-center gap-2">
                      <EyeOff size={16} /> Privacy
                    </label>
                    <p className="text-xs text-muted mt-1">Show my exact age on birthdays</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${showAge ? 'bg-primary' : 'bg-border'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${showAge ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={showAge} onChange={handleToggleAge} />
                  </label>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-surface rounded-2xl border border-border-subtle p-5">
              <h3 className="font-heading font-bold text-main mb-4 flex items-center gap-2">
                <Bell size={18} className="text-primary" /> Notifications
              </h3>
              
              <div className="space-y-4">
                {[
                  { key: 'posts', label: 'New posts from friends' },
                  { key: 'reactions', label: 'Reactions on my posts' },
                  { key: 'comments', label: 'Comments on my posts' },
                  { key: 'mentions', label: 'Mentions' },
                  { key: 'events', label: 'New events' },
                  { key: 'event_reminders', label: 'Event reminders' },
                  { key: 'birthdays', label: 'Birthdays' },
                  { key: 'polls', label: 'Poll created' },
                  { key: 'streak', label: 'Streak at risk' },
                  { key: 'expiry', label: 'Post expiry warning' },
                ].map((pref) => {
                  const currentValue = user.notificationPrefs?.[pref.key] ?? true;
                  return (
                    <div key={pref.key} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-main">{pref.label}</span>
                      <label className="flex items-center cursor-pointer">
                        <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${currentValue ? 'bg-primary' : 'bg-border'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${currentValue ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={currentValue} 
                          onChange={() => handleToggleNotificationPref(pref.key, currentValue)} 
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-surface rounded-2xl border p-5" style={{ borderColor: 'color-mix(in srgb, var(--color-danger) 20%, var(--color-border-subtle))' }}>
              <h3 className="font-heading font-bold text-danger mb-2 flex items-center gap-2">
                <LogOut size={18} /> Danger Zone
              </h3>
              <p className="text-xs text-muted mb-4">You will need to sign back in to access your account.</p>
              
              <button
                onClick={handleSignOut}
                className="w-full sm:w-auto px-5 py-2 rounded-xl text-sm font-bold transition-colors border"
                style={{
                  color: 'var(--color-danger)',
                  borderColor: 'var(--color-danger)',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'color-mix(in srgb, var(--color-danger) 10%, transparent)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
        
      </div>

      {/* Post Detail Modal */}
      {openPost && (
        <PostDetailModal
          post={openPost}
          onClose={() => setOpenPost(null)}
          onPrev={myPosts.findIndex(p => p.id === openPost.id) > 0 ? handlePrev : undefined}
          onNext={myPosts.findIndex(p => p.id === openPost.id) < myPosts.length - 1 ? handleNext : undefined}
          allUsers={allUsers}
        />
      )}
    </div>
  );
};

export default ProfilePage;
