import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { doc, getDoc, updateDoc, collection, query, getDocs, limit, where } from 'firebase/firestore';
import { Loader2, Edit2, CheckCircle, Save, X, Image as ImageIcon, MessageSquare, Gamepad2, Tv, Music, History, ShieldAlert, Cake, Hash, Camera, Link as LinkIcon, MoreHorizontal, Monitor, Flame } from 'lucide-react';
import { Facebook, Youtube, Twitter, Instagram, Github, Twitch } from '../components/ui/BrandIcons';

const getSiteIcon = (url: string) => {
  if (!url) return <LinkIcon size={16} />;
  const lower = url.toLowerCase();
  if (lower.includes('facebook.com') || lower.includes('fb.com')) return <Facebook size={16} />;
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return <Youtube size={16} />;
  if (lower.includes('twitter.com') || lower.includes('x.com')) return <Twitter size={16} />;
  if (lower.includes('instagram.com') || lower.includes('ig.me')) return <Instagram size={16} />;
  if (lower.includes('github.com')) return <Github size={16} />;
  if (lower.includes('twitch.tv')) return <Twitch size={16} />;
  if (lower.includes('steamcommunity.com')) return <Monitor size={16} />;
  return <LinkIcon size={16} />;
};
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { getAvatarColor } from '../utils/avatarColor';
import type { Post, User } from '../types';
import { PostCard } from '../components/feed/PostCard';
import { PostDetailModal } from '../components/feed/PostDetailModal';
import { TopMoviesSelector } from '../components/profile/TopMoviesSelector';
import { subscribeToCollection } from '../lib/firestore';

const ProfilePage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const { user: currentUser, isLoading: authLoading } = useAuthStore();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingVibes, setIsEditingVibes] = useState(false);
  const [isEditingMedia, setIsEditingMedia] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  
  // Data State
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Edit State
  const [editData, setEditData] = useState<Partial<User>>({});

  useEffect(() => {
    if (!handle) return;
    
    let isMounted = true;
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'users'), where('handle', '==', handle), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty && isMounted) {
          const docSnap = querySnapshot.docs[0];
          setProfileUser({ id: docSnap.id, ...docSnap.data() } as User);
        } else if (isMounted) {
          // Fallback if handle doesn't match, maybe they used an ID
          const docRef = doc(db, 'users', handle);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && isMounted) {
            setProfileUser({ id: docSnap.id, ...docSnap.data() } as User);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
        if (isMounted) toast.error('Failed to load profile');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchUser();
    
    // Fetch all users for mentions/seenBy in PostCard
    import('firebase/firestore').then(({ collection, getDocs }) => {
      getDocs(collection(db, 'users')).then(snap => {
        if (isMounted) setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as User));
      });
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowEditMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => { 
      isMounted = false; 
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handle]);

  useEffect(() => {
    if (!profileUser?.id || authLoading) return;
    const unsubPosts = subscribeToCollection<Post>(
      'posts', 
      (data) => {
        const getTime = (date: any) => {
          if (!date) return 0;
          if (typeof date === 'number') return date;
          if (typeof date.toMillis === 'function') return date.toMillis();
          if (date instanceof Date) return date.getTime();
          return new Date(date).getTime();
        };
        const sorted = [...data].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
        setUserPosts(sorted);
      },
      where('authorId', '==', profileUser.id)
    );
    
    return () => {
      unsubPosts();
    };
  }, [profileUser?.id, authLoading]);

  const isOwner = currentUser?.id === profileUser?.id;

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData({});
      setIsEditing(false);
    } else {
      setEditData({
        bannerUrl: profileUser?.bannerUrl || '',
        bio: profileUser?.bio || '',
        statusMessage: profileUser?.statusMessage || '',
        customTitle: profileUser?.customTitle || '',
        gamerTags: profileUser?.gamerTags || { riot: '', facebook: '', steam: '' },
        customLink: profileUser?.customLink || { name: '', url: '' },
        topMovies: profileUser?.topMovies || [],
        themeSongUrl: profileUser?.themeSongUrl || '',
        lore: profileUser?.lore || ''
      });
      setIsEditing(true);
    }
  };

  const handleEditVibesToggle = () => {
    if (isEditingVibes) {
      setIsEditingVibes(false);
    } else {
      setEditData(prev => ({
        ...prev,
        statusMessage: profileUser?.statusMessage || '',
        customTitle: profileUser?.customTitle || '',
        gamerTags: profileUser?.gamerTags || { riot: '', facebook: '', steam: '' },
        customLink: profileUser?.customLink || { name: '', url: '' },
      }));
      setIsEditingVibes(true);
    }
  };

  const handleSave = async () => {
    if (!profileUser?.id) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', profileUser.id), editData);
      setProfileUser({ ...profileUser, ...editData });
      setIsEditing(false);
      
      // Update auth store if saving own profile
      if (isOwner && currentUser) {
        useAuthStore.getState().setUser({ ...currentUser, ...editData });
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVibes = async () => {
    if (!profileUser?.id) return;
    setIsSaving(true);
    try {
      const vibesData = {
        statusMessage: editData.statusMessage || '',
        customTitle: editData.customTitle || '',
        gamerTags: editData.gamerTags || { riot: '', facebook: '', steam: '' },
        customLink: editData.customLink || { name: '', url: '' },
      };
      await updateDoc(doc(db, 'users', profileUser.id), vibesData);
      setProfileUser({ ...profileUser, ...vibesData });
      setIsEditingVibes(false);
      
      if (isOwner && currentUser) {
        useAuthStore.getState().setUser({ ...currentUser, ...vibesData });
      }
      toast.success('Vibes & Gaming updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update Vibes & Gaming');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMediaToggle = () => {
    if (isEditingMedia) {
      setIsEditingMedia(false);
    } else {
      setEditData(prev => ({
        ...prev,
        topMovies: profileUser?.topMovies || [],
        themeSongUrl: profileUser?.themeSongUrl || '',
      }));
      setIsEditingMedia(true);
    }
  };

  const handleSaveMedia = async () => {
    if (!profileUser?.id) return;
    setIsSaving(true);
    try {
      const mediaData = {
        topMovies: editData.topMovies || [],
        themeSongUrl: editData.themeSongUrl || '',
      };
      await updateDoc(doc(db, 'users', profileUser.id), mediaData);
      setProfileUser({ ...profileUser, ...mediaData });
      setIsEditingMedia(false);
      
      if (isOwner && currentUser) {
        useAuthStore.getState().setUser({ ...currentUser, ...mediaData });
      }
      toast.success('Media Shelf updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update Media Shelf');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateDaysUntilBirthday = (birthdate?: string) => {
    if (!birthdate) return null;
    const [_, month, day] = birthdate.split('-');
    const today = new Date();
    today.setHours(0,0,0,0);
    const bday = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
    
    if (bday.getTime() < today.getTime()) {
      bday.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = Math.abs(bday.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getZodiacSign = (birthdate?: string) => {
    if (!birthdate) return null;
    const [_, m, d] = birthdate.split('-').map(Number);
    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return '♈ Aries';
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return '♉ Taurus';
    if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return '♊ Gemini';
    if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return '♋ Cancer';
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return '♌ Leo';
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return '♍ Virgo';
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return '♎ Libra';
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return '♏ Scorpio';
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return '♐ Sagittarius';
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return '♑ Capricorn';
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return '♒ Aquarius';
    return '♓ Pisces';
  };

  const handleUpdateNested = (field: string, subField: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field as keyof User] as any || {}),
        [subField]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-12 text-muted">
        <ShieldAlert size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg">User not found</p>
      </div>
    );
  }

  const generatedHandle = `@${profileUser.displayName.replace(/\s+/g, '').toLowerCase()}`;
  const daysUntilBirthday = calculateDaysUntilBirthday(profileUser.birthdate);
  const zodiac = getZodiacSign(profileUser.birthdate);

  const renderThemeSongEmbed = (url: string) => {
    if (url.includes('spotify.com/track/')) {
      const match = url.match(/track\/([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        return (
          <iframe 
            style={{ borderRadius: '12px' }} 
            src={`https://open.spotify.com/embed/track/${match[1]}?theme=0`} 
            width="100%" 
            height="152" 
            frameBorder="0" 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy"
          />
        );
      }
    } else if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      }
      
      if (videoId) {
        return (
          <iframe 
            className="rounded-xl border border-border-subtle"
            width="100%" 
            height="200" 
            src={`https://www.youtube.com/embed/${videoId}`} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
            loading="lazy"
          />
        );
      }
    }
    
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl bg-base border border-border-subtle hover:border-primary transition-colors text-sm text-primary font-medium truncate">
        {url}
      </a>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in">
      
      {/* 1. Header & Identity */}
      <div className="bg-surface border border-border-subtle rounded-3xl shadow-sm mb-6 relative">
        
        {/* Banner Area */}
        <div className="h-48 sm:h-64 relative bg-pattern-grid border-b border-border-subtle rounded-t-3xl overflow-hidden">
          {profileUser.bannerUrl ? (
             <img src={profileUser.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5" />
          )}
          
          {isEditing && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-surface p-4 rounded-xl border border-border flex items-center gap-3">
                <ImageIcon size={20} className="text-muted flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Paste banner image URL..."
                  value={editData.bannerUrl || ''}
                  onChange={(e) => setEditData({ ...editData, bannerUrl: e.target.value })}
                  className="w-full bg-transparent border-none text-sm text-main placeholder-muted focus:outline-none"
                />
              </div>
            </div>
          )}
          
          {/* Edit Actions in Banner */}
          {isOwner && (
            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
              {isEditing ? (
                <>
                  <button onClick={handleEditToggle} className="flex items-center gap-2 rounded-lg px-3 py-1.5 shadow-sm bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors text-sm font-semibold">
                    <X size={16} /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 rounded-lg px-4 py-1.5 shadow-sm bg-primary text-on-primary hover:brightness-110 transition-colors text-sm font-bold">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                </>
              ) : (
                <button onClick={handleEditToggle} className="flex items-center gap-2 rounded-lg px-3 py-1.5 shadow-sm bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors text-sm font-semibold border border-white/10">
                  <Camera size={16} /> Edit Cover Photo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Profile Info Overlay */}
        <div className="px-6 pb-6 pt-16 sm:pt-20 relative">
          {/* Avatar */}
          <div className="absolute -top-16 sm:-top-20 left-6">
            <div 
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-surface shadow-xl flex items-center justify-center font-bold text-white text-5xl overflow-hidden bg-base relative group"
              style={{ background: profileUser.avatarUrl ? undefined : getAvatarColor(profileUser.displayName) }}
            >
              {profileUser.avatarUrl ? (
                <img src={profileUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                profileUser.displayName.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="flex justify-between items-start mt-2">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-main">{profileUser.displayName}</h1>
              <p className="text-primary font-medium text-sm mt-1">{generatedHandle}</p>
              
              {isEditing ? (
                <textarea
                  value={editData.bio || ''}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Write a short bio..."
                  className="mt-4 w-full bg-base border border-border rounded-xl p-3 text-main focus:ring-1 focus:ring-primary outline-none resize-none h-24 text-sm"
                />
              ) : (
                profileUser.bio && (
                  <p className="mt-4 text-main leading-relaxed max-w-2xl">{profileUser.bio}</p>
                )
              )}
            </div>

            {/* 3-dot Edit Menu for Global Edit */}
            {isOwner && !isEditing && (
              <div className="relative ml-4" ref={menuRef}>
                <button onClick={() => setShowEditMenu(!showEditMenu)} className="p-2 rounded-full hover:bg-base text-muted transition-colors">
                  <MoreHorizontal size={20} />
                </button>
                {showEditMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border-subtle rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => { setShowEditMenu(false); handleEditToggle(); }} 
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-main hover:bg-base transition-colors"
                    >
                      <Edit2 size={16} /> Edit Profile
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Vibes, Lore, Badges */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Vibes & Gaming Module */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <Hash size={16} /> Vibes & Gaming
              </h2>
              {isOwner && !isEditingVibes && (
                <button onClick={handleEditVibesToggle} className="p-1.5 text-muted hover:text-main hover:bg-base rounded-md transition-colors" title="Edit Vibes & Gaming">
                  <Edit2 size={14} />
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted block mb-1">Current Status</label>
                {isEditingVibes ? (
                  <input
                    type="text"
                    value={editData.statusMessage || ''}
                    onChange={(e) => setEditData({ ...editData, statusMessage: e.target.value })}
                    placeholder="e.g. Debugging, Sleeping..."
                    className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-main outline-none focus:border-primary"
                  />
                ) : (
                  <div className="text-sm text-main font-medium bg-base py-2 px-3 rounded-lg border border-border-subtle shadow-inner inline-block">
                    {profileUser.statusMessage || 'Vibing'}
                  </div>
                )}
              </div>

              {/* Custom Title */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted block mb-1">Title</label>
                {isEditingVibes ? (
                  <input
                    type="text"
                    value={editData.customTitle || ''}
                    onChange={(e) => setEditData({ ...editData, customTitle: e.target.value })}
                    placeholder="Neighborhood title"
                    className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-main outline-none focus:border-primary"
                  />
                ) : (
                  <div className="text-sm text-primary font-bold">
                    {profileUser.customTitle || 'Member'}
                  </div>
                )}
              </div>

              {/* Gamer Tags */}
              <div className="pt-2 border-t border-border-subtle space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
                    <Gamepad2 size={16} />
                  </div>
                  {isEditingVibes ? (
                    <input
                      type="text"
                      value={editData.gamerTags?.riot || ''}
                      onChange={(e) => handleUpdateNested('gamerTags', 'riot', e.target.value)}
                      placeholder="Riot ID"
                      className="w-full bg-base border border-border rounded-lg px-3 py-1.5 text-sm text-main outline-none"
                    />
                  ) : (
                    <div className="text-sm">
                      <span className="text-muted text-xs block">Riot ID</span>
                      <span className="font-medium">{profileUser.gamerTags?.riot || 'Not linked'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Facebook size={16} />
                  </div>
                  {isEditingVibes ? (
                    <input
                      type="text"
                      value={editData.gamerTags?.facebook || ''}
                      onChange={(e) => handleUpdateNested('gamerTags', 'facebook', e.target.value)}
                      placeholder="Facebook Profile URL or Name"
                      className="w-full bg-base border border-border rounded-lg px-3 py-1.5 text-sm text-main outline-none"
                    />
                  ) : (
                    <div className="text-sm overflow-hidden w-full">
                      <span className="text-muted text-xs block">Facebook</span>
                      {profileUser.gamerTags?.facebook ? (
                        profileUser.gamerTags.facebook.startsWith('http') ? (
                          <a href={profileUser.gamerTags.facebook} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate block">
                            {profileUser.gamerTags.facebook.split('facebook.com/')[1] || 'Facebook Profile'}
                          </a>
                        ) : (
                          <span className="font-medium">{profileUser.gamerTags.facebook}</span>
                        )
                      ) : (
                        <span className="font-medium">Not linked</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-main/10 text-main flex items-center justify-center flex-shrink-0">
                    <Monitor size={16} />
                  </div>
                  {isEditingVibes ? (
                    <input
                      type="text"
                      value={editData.gamerTags?.steam || ''}
                      onChange={(e) => handleUpdateNested('gamerTags', 'steam', e.target.value)}
                      placeholder="Steam ID or URL"
                      className="w-full bg-base border border-border rounded-lg px-3 py-1.5 text-sm text-main outline-none"
                    />
                  ) : (
                    <div className="text-sm overflow-hidden w-full">
                      <span className="text-muted text-xs block">Steam</span>
                      {profileUser.gamerTags?.steam ? (
                        profileUser.gamerTags.steam.startsWith('http') ? (
                          <a href={profileUser.gamerTags.steam} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate block">
                            {profileUser.gamerTags.steam.split('steamcommunity.com/id/')[1] || profileUser.gamerTags.steam.split('steamcommunity.com/profiles/')[1] || 'Steam Profile'}
                          </a>
                        ) : (
                          <span className="font-medium">{profileUser.gamerTags.steam}</span>
                        )
                      ) : (
                        <span className="font-medium">Not linked</span>
                      )}
                    </div>
                  )}
                </div>

                {(isEditingVibes || profileUser.customLink?.url) && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      {isEditingVibes ? <LinkIcon size={16} /> : getSiteIcon(profileUser.customLink?.url || '')}
                    </div>
                    {isEditingVibes ? (
                      <div className="w-full flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editData.customLink?.name || ''}
                          onChange={(e) => handleUpdateNested('customLink', 'name', e.target.value)}
                          placeholder="Link Name"
                          className="w-full sm:w-1/3 bg-base border border-border rounded-lg px-3 py-1.5 text-sm text-main outline-none"
                        />
                        <input
                          type="url"
                          value={editData.customLink?.url || ''}
                          onChange={(e) => handleUpdateNested('customLink', 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full sm:flex-1 bg-base border border-border rounded-lg px-3 py-1.5 text-sm text-main outline-none"
                        />
                      </div>
                    ) : (
                      <div className="text-sm w-full overflow-hidden">
                        <span className="text-muted text-xs block">Custom Link</span>
                        <a href={profileUser.customLink?.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate block">
                          {profileUser.customLink?.name || profileUser.customLink?.url}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {isEditingVibes && (
                <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-border-subtle">
                  <button onClick={() => setIsEditingVibes(false)} className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-base border border-border hover:bg-surface text-main transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveVibes} disabled={isSaving} className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg bg-primary text-on-primary hover:brightness-110 transition-colors">
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Milestones & Lore Module */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
              <History size={16} /> Milestones & Lore
            </h2>
            
            <div className="space-y-4">
              {/* Birthday */}
              {(profileUser.birthdate || isEditing) && (
                <div className="flex items-center gap-3 bg-base p-3 rounded-xl border border-border-subtle">
                  <Cake size={20} className="text-primary" />
                  <div>
                    <div className="text-sm font-bold text-main">
                      {daysUntilBirthday === 0 ? 'Birthday is today! 🎉' : `${daysUntilBirthday} days until birthday`}
                    </div>
                    {zodiac && <div className="text-xs text-muted">{zodiac}</div>}
                  </div>
                </div>
              )}

              {/* Login Streak */}
              {(profileUser.loginStreak ?? 0) > 0 && (
                <div className="flex items-center gap-3 bg-base p-3 rounded-xl border border-border-subtle">
                  <Flame size={20} className="text-orange-500" />
                  <div>
                    <div className="text-sm font-bold text-main">
                      {profileUser.loginStreak} Day Streak 🔥
                    </div>
                    <div className="text-xs text-muted">
                      Personal login streak
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Badges */}
              {profileUser.badges && profileUser.badges.length > 0 && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted block mb-2">Badges</label>
                  <div className="flex flex-wrap gap-2">
                    {profileUser.badges.map(badge => (
                      <span key={badge} className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
                        <CheckCircle size={12} /> {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lore */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted block mb-2">Origin Story</label>
                {isEditing ? (
                  <textarea
                    value={editData.lore || ''}
                    onChange={(e) => setEditData({ ...editData, lore: e.target.value })}
                    placeholder="How did you join the neighborhood?"
                    className="w-full bg-base border border-border rounded-xl p-3 text-sm text-main focus:ring-1 focus:ring-primary outline-none resize-none h-32"
                  />
                ) : (
                  <div className="text-sm text-main leading-relaxed bg-base p-3 rounded-xl border border-border-subtle whitespace-pre-wrap italic">
                    {profileUser.lore || 'The archives are incomplete...'}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Media, Feed */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Media Shelf Module */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <Tv size={16} /> Media Shelf
              </h2>
              {isOwner && !isEditingMedia && (
                <button onClick={handleEditMediaToggle} className="p-1.5 text-muted hover:text-main hover:bg-base rounded-md transition-colors" title="Edit Media Shelf">
                  <Edit2 size={14} />
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Top 4 Watches */}
              <div>
                <label className="text-xs font-bold text-main block mb-3">Top 4 Watches</label>
                {isEditingMedia ? (
                  <TopMoviesSelector
                    movies={editData.topMovies || []}
                    onChange={(movies) => setEditData({ ...editData, topMovies: movies })}
                  />
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => {
                      const movie = (profileUser.topMovies || [])[i];
                      return (
                        <div key={i} className="aspect-[2/3] bg-base border border-border-subtle rounded-xl overflow-hidden relative shadow-sm flex items-center justify-center group">
                          {movie ? (
                            <>
                              <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                                <span className="text-[10px] text-white font-bold leading-tight line-clamp-3">{movie.title}</span>
                              </div>
                            </>
                          ) : (
                            <Tv size={24} className="text-border-subtle" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Theme Song */}
              <div className="pt-4 border-t border-border-subtle">
                <label className="text-xs font-bold text-main block mb-2 flex items-center gap-2">
                  <Music size={14} className="text-primary" /> Theme Song
                </label>
                {isEditingMedia ? (
                  <input
                    type="url"
                    value={editData.themeSongUrl || ''}
                    onChange={(e) => setEditData({ ...editData, themeSongUrl: e.target.value })}
                    placeholder="YouTube or Spotify URL"
                    className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-main outline-none focus:border-primary"
                  />
                ) : (
                  profileUser.themeSongUrl ? (
                    renderThemeSongEmbed(profileUser.themeSongUrl)
                  ) : (
                    <p className="text-sm text-muted italic">No theme song set.</p>
                  )
                )}
              </div>
              
              {isEditingMedia && (
                <div className="flex justify-end gap-2 pt-4 border-t border-border-subtle">
                  <button onClick={() => setIsEditingMedia(false)} className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-base border border-border hover:bg-surface text-main transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveMedia} disabled={isSaving} className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg bg-primary text-on-primary hover:brightness-110 transition-colors">
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Personal Feed */}
          <div>
            <div className="flex items-center gap-3 mb-4 mt-2">
              <h2 className="text-lg font-heading font-bold text-main">Personal Feed</h2>
              <div className="h-px bg-border-subtle flex-1" />
            </div>

            <div className="space-y-4">
              {userPosts.length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle shadow-sm">
                  <MessageSquare size={32} className="mx-auto mb-3 text-border" />
                  <p className="text-muted font-medium">No posts yet</p>
                </div>
              ) : (
                userPosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onOpenPost={setOpenPost} 
                    allUsers={allUsers}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {openPost && (
        <PostDetailModal
          post={openPost}
          onClose={() => setOpenPost(null)}
          allUsers={allUsers}
        />
      )}
    </div>
  );
};

export default ProfilePage;
