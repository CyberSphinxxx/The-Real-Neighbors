import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Palette, LayoutGrid, Bell, Shield, Database, Info, 
  Pencil, Sparkles, Moon, Sun, Type, Layout, Sliders, Activity, Calendar, Zap,
  EyeOff, Download, ShieldAlert, Cake,
  Radio, HardDrive, Cpu, MapPin
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { updateDoc } from '../lib/firestore';
import { useTheme, type ThemeName } from '../hooks/useTheme';
import { getAvatarColor } from '../utils/avatarColor';
import toast from 'react-hot-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const TABS = [
  { id: 'profile', label: 'Profile', subtitle: 'Personal info & avatar', icon: User },
  { id: 'appearance', label: 'Appearance', subtitle: 'Themes & visual settings', icon: Palette },
  { id: 'feed', label: 'Feed Preferences', subtitle: 'Customize your feed', icon: LayoutGrid },
  { id: 'notifications', label: 'Notifications', subtitle: 'Alerts & activity', icon: Bell },
  { id: 'privacy', label: 'Privacy', subtitle: 'Visibility & data sharing', icon: Shield },
  { id: 'data', label: 'Data & Storage', subtitle: 'Cache & your data', icon: Database },
  { id: 'about', label: 'About', subtitle: 'Version & credits', icon: Info },
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [editName, setEditName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBirthdate, setEditBirthdate] = useState('');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Appearance State
  const { currentTheme, setTheme } = useTheme();
  const [bgPattern, setBgPattern] = useState(localStorage.getItem('bg-pattern') || 'none');
  const [bgAnimation, setBgAnimation] = useState(localStorage.getItem('bg-animation') || 'none');
  const [fontSize, setFontSize] = useState(localStorage.getItem('font-size') || '14px');

  // Load user data
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditName(user.displayName || '');
      setEditAvatarUrl(user.avatarUrl || '');
      setEditBirthdate(user.birthdate || '');
    }
  }, [user]);

  const hasProfileChanges = user && (
    editName !== user.displayName || 
    editAvatarUrl !== (user.avatarUrl || '') || 
    editBirthdate !== (user.birthdate || '')
  );

  const handleSaveProfile = async () => {
    if (!user || !editName.trim()) return;
    setIsSaving(true);
    try {
      await updateDoc('users', [user.id], {
        displayName: editName.trim(),
        avatarUrl: editAvatarUrl.trim() || null,
        birthdate: editBirthdate || null,
      });
      setUser({ ...user, displayName: editName.trim(), avatarUrl: editAvatarUrl.trim() || undefined, birthdate: editBirthdate || undefined });
      toast.success('Profile updated ✓');
      setIsEditingAvatar(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelProfile = () => {
    if (user) {
      setEditName(user.displayName || '');
      setEditAvatarUrl(user.avatarUrl || '');
      setEditBirthdate(user.birthdate || '');
      setIsEditingAvatar(false);
    }
  };

  const handleAccentChange = async (color: string) => {
    if (!user) return;
    try {
      await updateDoc('users', [user.id], { accentColor: color });
      setUser({ ...user, accentColor: color });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update accent color');
    }
  };

  const handleToggleAge = async () => {
    if (!user) return;
    const newValue = !(user.showAge ?? true);
    try {
      await updateDoc('users', [user.id], { showAge: newValue });
      setUser({ ...user, showAge: newValue });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update preference');
    }
  };

  const handleTogglePrivacyPref = async (key: string, currentVal: boolean) => {
    if (!user) return;
    try {
      const newVal = !currentVal;
      await updateDoc('users', [user.id], { [`privacyPrefs.${key}`]: newVal });
      setUser({
        ...user,
        privacyPrefs: {
          ...(user.privacyPrefs || {}),
          [key]: newVal
        }
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update privacy preference');
    }
  };

  const clearRedditCache = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('reddit_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    toast.success(`Cleared ${keysToRemove.length} items from Reddit cache`);
  };

  const handleExportData = () => {
    if (!user) return;
    const dataStr = JSON.stringify(user, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `data-${user.displayName.replace(/\s+/g, '-').toLowerCase()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Data exported');
  };


  const handleThemeChange = (theme: ThemeName) => {
    setTheme(theme);
  };

  const handlePatternChange = (pattern: string) => {
    setBgPattern(pattern);
    localStorage.setItem('bg-pattern', pattern);
    window.dispatchEvent(new Event('bg-pattern-changed'));
  };

  const handleAnimationChange = (anim: string) => {
    setBgAnimation(anim);
    localStorage.setItem('bg-animation', anim);
    window.dispatchEvent(new Event('bg-animation-changed'));
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem('font-size', size);
    window.dispatchEvent(new Event('font-size-changed'));
  };

  const handleFeedPrefChange = async (key: string, value: string | boolean) => {
    if (!user) return;
    const currentPrefs = user.feedPrefs || {};
    const newPrefs = { ...currentPrefs, [key]: value };
    setUser({ ...user, feedPrefs: newPrefs });
    try {
      await updateDoc('users', [user.id], { feedPrefs: newPrefs });
    } catch (err) {
      console.error(err);
      setUser({ ...user, feedPrefs: currentPrefs });
      toast.error('Failed to update feed preferences');
    }
  };

  const handleToggleNotificationPref = async (key: string, currentValue: boolean) => {
    if (!user) return;
    const currentPrefs = user.notificationPrefs || {};
    const newValue = currentValue === undefined ? false : !currentValue;
    const newPrefs = { ...currentPrefs, [key]: newValue };
    
    setUser({ ...user, notificationPrefs: newPrefs });
    try {
      await updateDoc('users', [user.id], { notificationPrefs: newPrefs });
    } catch (err) {
      console.error(err);
      setUser({ ...user, notificationPrefs: currentPrefs });
      toast.error('Failed to update notification settings');
    }
  };

  const sendTestNotification = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.id, 'notifications'), {
        type: 'post',
        fromUid: 'system',
        fromName: 'System',
        fromAvatarColor: '#3b82f6',
        message: "🔔 Test notification — it's working!",
        isRead: false,
        createdAt: Date.now()
      });
      toast.success('Test notification sent! Check your bell. 🔔');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send notification');
    }
  };

  if (!user) return null;

  const currentPrefs = user.feedPrefs || {};


  return (
    <div className="flex flex-col h-screen bg-transparent overflow-hidden">
      {/* Header Bar */}
      <div className="h-14 bg-surface border-b border-border-subtle flex items-center px-4 shrink-0 z-10">
        <button 
          onClick={() => navigate('/feed')}
          className="p-2 hover:bg-elevated rounded-full transition-colors mr-3"
        >
          <ArrowLeft size={20} className="text-main" />
        </button>
        <div className="flex flex-col">
          <h1 className="font-heading font-bold text-lg leading-tight text-main">Settings</h1>
          <span className="text-faint text-sm leading-tight">Customize your experience</span>
        </div>
      </div>

      {/* Two Column Layout on Desktop, Vertical on Mobile */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative z-10">
        
        {/* Mobile Tab Nav (Horizontal Scroll) */}
        <div className="md:hidden flex overflow-x-auto custom-scrollbar border-b border-border-subtle bg-surface shrink-0 px-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  isActive ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-primary' : 'text-muted'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Left Column - Tab Nav (Desktop) */}
        <div className="w-[260px] bg-surface border-r border-border-subtle p-4 overflow-y-auto hidden md:block shrink-0">
          <nav className="flex flex-col gap-1">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-start gap-3 w-full text-left px-3 py-3 rounded-xl transition-all relative ${
                    isActive ? 'bg-primary/10 text-primary rounded-r-xl rounded-l-none ml-1' : 'text-muted hover:bg-elevated text-main'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-[-4px] top-0 bottom-0 w-1 bg-primary rounded-r" />
                  )}
                  <Icon size={20} className={isActive ? 'text-primary' : 'text-muted'} />
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-main'}`}>{tab.label}</span>
                    <span className="text-xs text-faint">{tab.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar relative bg-transparent"
        >
          <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 pb-24">         
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="font-heading font-bold text-xl text-main mb-1">Profile</h2>
                <p className="text-faint text-sm mb-6">Manage your personal information</p>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <User size={14} /> Identity
                  </h3>
                  
                  <div className="flex items-start gap-6">
                    <div 
                      className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden cursor-pointer group"
                      style={{ background: user.avatarUrl ? undefined : getAvatarColor(user.displayName) }}
                      onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                    >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        user.displayName.charAt(0).toUpperCase()
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil size={16} className="text-white" />
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-main mb-1">Display Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-elevated rounded-lg border border-border-subtle px-3 py-2 text-sm text-main focus:border-primary outline-none"
                        />
                        <p className="text-faint text-xs mt-1">This is how others see you in the app</p>
                      </div>

                      {isEditingAvatar && (
                        <div>
                          <label className="block text-sm font-medium text-main mb-1">Avatar URL</label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={editAvatarUrl}
                              onChange={e => setEditAvatarUrl(e.target.value)}
                              placeholder="https://example.com/image.jpg"
                              className="flex-1 bg-elevated rounded-lg border border-border-subtle px-3 py-2 text-sm text-main focus:border-primary outline-none"
                            />
                            {editAvatarUrl && (
                              <img src={editAvatarUrl} alt="preview" className="w-9 h-9 rounded-full object-cover border border-border-subtle shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-main mb-1">Birthdate</label>
                        <input
                          type="date"
                          value={editBirthdate}
                          onChange={e => setEditBirthdate(e.target.value)}
                          className="w-full bg-elevated rounded-lg border border-border-subtle px-3 py-2 text-sm text-main focus:border-primary outline-none"
                        />
                        <p className="text-faint text-xs mt-1">Used for the birthday tracker</p>
                      </div>
                    </div>
                  </div>

                  {hasProfileChanges && (
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border-subtle">
                      <button 
                        onClick={handleCancelProfile}
                        className="px-4 py-2 text-sm font-medium text-muted hover:text-main transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="px-5 py-2 bg-primary text-on-primary rounded-full text-sm font-medium transition-opacity disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Sparkles size={14} /> Personalization
                  </h3>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-main mb-1">Accent Color</label>
                    <p className="text-faint text-xs mb-3">Your personal highlight color used for your avatar and mentions</p>
                    
                    <div className="flex flex-wrap gap-3">
                      {['#6366f1', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#22c55e', '#14b8a6', '#06b6d4'].map(color => (
                        <div 
                          key={color}
                          onClick={() => handleAccentChange(color)}
                          className={`w-7 h-7 rounded-full cursor-pointer transition-all ${user.accentColor === color ? 'ring-2 ring-offset-2 ring-primary ring-offset-surface' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-border-subtle">
                        <input 
                          type="color" 
                          value={user.accentColor || '#3b82f6'} 
                          onChange={e => handleAccentChange(e.target.value)}
                          className="absolute inset-[-10px] w-12 h-12 cursor-pointer p-0 border-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                    <div>
                      <span className="text-sm font-medium text-main">Show my age on Birthday tracker</span>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${(user.showAge ?? true) ? 'bg-primary' : 'bg-border'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${(user.showAge ?? true) ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={user.showAge ?? true} onChange={handleToggleAge} />
                    </label>
                  </div>

                </div>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="font-heading font-bold text-xl text-main mb-1">Appearance</h2>
                <p className="text-faint text-sm mb-6">Make it yours</p>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Palette size={14} /> Theme
                  </h3>

                  <div className="bg-elevated rounded-2xl border border-border-subtle p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary" />
                      <div>
                        <div className="text-xs text-faint uppercase tracking-wide font-semibold mb-1">Current Look</div>
                        <div className="font-bold text-xl text-main capitalize">{currentTheme}</div>
                        <div className="text-faint text-sm">Active color palette</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-faint uppercase tracking-wide font-semibold mb-2">Quick Switch</div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setTheme('default')} className="w-8 h-8 rounded-full bg-elevated border border-border-subtle flex items-center justify-center text-muted hover:text-main hover:bg-surface">
                          <Sun size={16} />
                        </button>
                        <button onClick={() => setTheme('dark')} className="w-8 h-8 rounded-full bg-elevated border border-border-subtle flex items-center justify-center text-muted hover:text-main hover:bg-surface">
                          <Moon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'dark', name: 'Dark', desc: 'Default dark', color: '#3b82f6', bg: '#111827' },
                      { id: 'amoled', name: 'AMOLED', desc: 'Pure black', color: '#3b82f6', bg: '#000000' },
                      { id: 'default', name: 'Light', desc: 'Clean & minimal', color: '#3b82f6', bg: '#ffffff' },
                      { id: 'synthwave', name: 'Synthwave', desc: 'Neon retro', color: '#f0abfc', bg: '#1e102f' },
                      { id: 'midnight', name: 'Midnight', desc: 'Deep blue', color: '#22d3ee', bg: '#020617' },
                      { id: 'forest', name: 'Forest', desc: 'Natural tones', color: '#34d399', bg: '#064e3b' },
                      { id: 'sunset', name: 'Sunset', desc: 'Warm vibes', color: '#fb923c', bg: '#451a03' },
                      { id: 'ocean', name: 'Ocean', desc: 'Deep waters', color: '#38bdf8', bg: '#083344' },
                    ].map(t => (
                      <div 
                        key={t.id}
                        onClick={() => handleThemeChange(t.id as ThemeName)}
                        className={`bg-elevated rounded-xl border p-3 cursor-pointer transition-all hover:border-primary relative ${currentTheme === t.id ? 'border-primary' : 'border-border-subtle'}`}
                      >
                        <div className="w-12 h-12 rounded-lg mb-2 shadow-sm ring-1 ring-inset ring-black/10" style={{ background: t.bg }}>
                          <div className="w-full h-full rounded-lg opacity-80" style={{ background: `linear-gradient(135deg, ${t.color} 0%, transparent 100%)` }} />
                        </div>
                        <div className="text-sm font-semibold text-main">{t.name}</div>
                        <div className="text-xs text-faint">{t.desc}</div>
                        {currentTheme === t.id && (
                          <div className="absolute bottom-3 right-3 bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                            ✓ Active
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <LayoutGrid size={14} /> Background Pattern
                  </h3>
                  
                  <div className="flex flex-wrap gap-4">
                    {[
                      { id: 'none', label: 'Clean', style: {} },
                      { id: 'grid', label: 'Technical', style: { backgroundImage: 'linear-gradient(var(--color-border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-subtle) 1px, transparent 1px)', backgroundSize: '12px 12px' } },
                      { id: 'dots', label: 'Minimal', style: { backgroundImage: 'radial-gradient(circle, var(--color-border) 1px, transparent 1px)', backgroundSize: '10px 10px' } },
                      { id: 'cross', label: 'Precise', style: { backgroundImage: 'linear-gradient(var(--color-border-subtle) 2px, transparent 2px), linear-gradient(90deg, var(--color-border-subtle) 2px, transparent 2px)', backgroundSize: '20px 20px', backgroundPosition: 'center' } },
                      { id: 'waves', label: 'Fluid', style: { backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'30\' height=\'30\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' } },
                    ].map(p => (
                      <div key={p.id} className="flex flex-col items-center gap-2">
                        <div 
                          onClick={() => handlePatternChange(p.id)}
                          className={`w-[100px] h-[80px] rounded-xl border cursor-pointer transition-all bg-base ${bgPattern === p.id ? 'border-primary ring-2 ring-primary/30' : 'border-border-subtle hover:border-muted'}`}
                          style={p.style}
                        />
                        <span className="text-xs text-faint">{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Sparkles size={14} /> Animated Background
                  </h3>
                  
                  <div className="flex flex-wrap gap-4">
                    {[
                      { id: 'none', label: 'Off', class: '' },
                      { id: 'aurora', label: 'Northern lights', class: 'bg-gradient-to-br from-primary/20 via-transparent to-secondary/20' },
                      { id: 'particles', label: 'Floating dust', class: '' },
                      { id: 'bubbles', label: 'Rising shapes', class: '' },
                      { id: 'rain', label: 'Chill vibes', class: '' },
                    ].map(a => (
                      <div key={a.id} className="flex flex-col items-center gap-2">
                        <div 
                          onClick={() => handleAnimationChange(a.id)}
                          className={`w-[120px] h-[80px] rounded-xl border cursor-pointer transition-all bg-base relative overflow-hidden ${bgAnimation === a.id ? 'border-primary ring-2 ring-primary/30' : 'border-border-subtle hover:border-muted'} ${a.class}`}
                        >
                           {/* Mini preview representations */}
                           {a.id === 'particles' && <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_50%,_var(--color-primary)_1px,_transparent_1px)]" style={{ backgroundSize: '15px 15px' }} />}
                           {a.id === 'bubbles' && <div className="absolute inset-0 opacity-50"><div className="w-4 h-4 rounded-full border border-primary absolute bottom-2 left-4" /><div className="w-6 h-6 rounded-full border border-primary absolute bottom-6 right-6" /></div>}
                           {a.id === 'rain' && <div className="absolute inset-0 opacity-30"><div className="w-0.5 h-8 bg-gradient-to-b from-transparent to-primary absolute top-2 left-6 transform rotate-20" /><div className="w-0.5 h-12 bg-gradient-to-b from-transparent to-primary absolute top-6 right-8 transform rotate-20" /></div>}
                        </div>
                        <span className="text-xs text-faint">{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Type size={14} /> Typography
                  </h3>
                  
                  <div className="flex gap-4">
                    {[
                      { id: '13px', label: 'Compact', desc: 'Smaller text, more content' },
                      { id: '14px', label: 'Normal', desc: 'Default size' },
                      { id: '16px', label: 'Comfortable', desc: 'Larger, easier to read' },
                    ].map(f => (
                      <div 
                        key={f.id}
                        onClick={() => handleFontSizeChange(f.id)}
                        className={`flex-1 rounded-xl border p-3 text-center cursor-pointer transition-all ${fontSize === f.id ? 'border-primary bg-primary/10' : 'border-border-subtle hover:bg-elevated'}`}
                      >
                        <div className="font-semibold text-main mb-1" style={{ fontSize: f.id }}>{f.label}</div>
                        <div className="text-xs text-faint">{f.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FEED PREFERENCES TAB */}
            {activeTab === 'feed' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="font-heading font-bold text-xl text-main mb-1">Feed Preferences</h2>
                <p className="text-faint text-sm mb-6">Customize how your feed looks and behaves</p>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Layout size={14} /> Default View
                  </h3>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-main mb-2">Default Sort</label>
                    <div className="flex gap-4">
                      <div 
                        onClick={() => handleFeedPrefChange('defaultSort', 'latest')}
                        className={`flex-1 rounded-xl border p-3 text-center cursor-pointer transition-all ${(currentPrefs.defaultSort || 'latest') === 'latest' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border-subtle hover:bg-elevated text-main'}`}
                      >
                        ✨ Latest
                      </div>
                      <div 
                        onClick={() => handleFeedPrefChange('defaultSort', 'reacted')}
                        className={`flex-1 rounded-xl border p-3 text-center cursor-pointer transition-all ${currentPrefs.defaultSort === 'reacted' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border-subtle hover:bg-elevated text-main'}`}
                      >
                        🔥 Most Reacted
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main mb-2">Default Filter</label>
                    <select 
                      value={currentPrefs.defaultFilter || 'all'}
                      onChange={e => handleFeedPrefChange('defaultFilter', e.target.value)}
                      className="w-full bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-main font-semibold outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="all">All Posts</option>
                      <option value="videos">Videos Only</option>
                      <option value="images">Images Only</option>
                      <option value="colored">Colored Text Only</option>
                      <option value="links">Links Only</option>
                    </select>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Sliders size={14} /> Feed Behavior
                  </h3>
                  
                  <div className="space-y-6">
                    {[
                      { key: 'autoLoad', label: 'Auto-load new posts', desc: "Automatically show new posts without the 'new posts' pill prompt", default: false },
                      { key: 'showSeenBy', label: "Show 'Seen by' counter", desc: "Show who has viewed each post below reactions", default: true },
                      { key: 'showReactionTooltips', label: "Show reaction tooltips", desc: "Show names on hover over reaction counts", default: true },
                      { key: 'compactCards', label: "Compact post cards", desc: "Reduce card padding for a denser feed", default: false },
                    ].map(pref => {
                      const val = currentPrefs[pref.key as keyof typeof currentPrefs] ?? pref.default;
                      return (
                        <div key={pref.key} className="flex items-center justify-between">
                          <div className="pr-4">
                            <div className="text-sm font-medium text-main">{pref.label}</div>
                            <div className="text-xs text-faint mt-0.5">{pref.desc}</div>
                          </div>
                          <label className="flex items-center cursor-pointer shrink-0">
                            <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${val ? 'bg-primary' : 'bg-border'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${val ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={val as boolean} onChange={() => handleFeedPrefChange(pref.key, !val)} />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="font-heading font-bold text-xl text-main mb-1">Notifications</h2>
                <p className="text-faint text-sm mb-6">Choose what alerts you receive</p>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Activity size={14} /> Activity
                  </h3>
                  <div className="space-y-5">
                    {[
                      { key: 'posts', label: 'New posts from friends' },
                      { key: 'reactions', label: 'Reactions on my posts' },
                      { key: 'comments', label: 'Comments on my posts' },
                      { key: 'mentions', label: 'Mentions (@mentions)' },
                    ].map(pref => {
                      const val = user.notificationPrefs?.[pref.key] ?? true;
                      return (
                        <div key={pref.key} className="flex items-center justify-between">
                          <div className="text-sm font-medium text-main">{pref.label}</div>
                          <label className="flex items-center cursor-pointer">
                            <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${val ? 'bg-primary' : 'bg-border'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${val ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={val} onChange={() => handleToggleNotificationPref(pref.key, val)} />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Calendar size={14} /> Events & Reminders
                  </h3>
                  <div className="space-y-5">
                    {[
                      { key: 'events', label: 'New events created' },
                      { key: 'eventReminders', label: 'Event reminders — day before' },
                      { key: 'birthdays', label: 'Birthday alerts' },
                    ].map(pref => {
                      const val = user.notificationPrefs?.[pref.key] ?? true;
                      return (
                        <div key={pref.key} className="flex items-center justify-between">
                          <div className="text-sm font-medium text-main">{pref.label}</div>
                          <label className="flex items-center cursor-pointer">
                            <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${val ? 'bg-primary' : 'bg-border'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${val ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={val} onChange={() => handleToggleNotificationPref(pref.key, val)} />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Zap size={14} /> App Activity
                  </h3>
                  <div className="space-y-5">
                    {[
                      { key: 'polls', label: 'New poll created' },
                      { key: 'streakRisk', label: 'Streak at risk warning' },
                      { key: 'expiry', label: 'Post expiry warning' },
                    ].map(pref => {
                      const val = user.notificationPrefs?.[pref.key] ?? true;
                      return (
                        <div key={pref.key} className="flex items-center justify-between">
                          <div className="text-sm font-medium text-main">{pref.label}</div>
                          <label className="flex items-center cursor-pointer">
                            <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${val ? 'bg-primary' : 'bg-border'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${val ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={val} onChange={() => handleToggleNotificationPref(pref.key, val)} />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={sendTestNotification}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
                >
                  <Bell size={18} /> Send test notification
                </button>
              </div>
            )}

            {/* PRIVACY TAB */}
            {activeTab === 'privacy' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="font-heading font-bold text-xl text-main mb-1">Privacy</h2>
                <p className="text-faint text-sm mb-6">Control your visibility within the group</p>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Radio size={14} /> Online Status
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <div className="text-sm font-medium text-main">Show when I'm online</div>
                      <div className="text-xs text-faint mt-0.5">Others can see your green dot and 'Online now' status in the Who's Online widget and on your posts</div>
                    </div>
                    <label className="flex items-center cursor-pointer shrink-0">
                      <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${(user?.privacyPrefs?.showOnlineStatus ?? true) ? 'bg-primary' : 'bg-border'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${(user?.privacyPrefs?.showOnlineStatus ?? true) ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={user?.privacyPrefs?.showOnlineStatus ?? true} onChange={() => handleTogglePrivacyPref('showOnlineStatus', user?.privacyPrefs?.showOnlineStatus ?? true)} />
                    </label>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-border-subtle">
                    <div className="pr-4">
                      <div className="text-sm font-medium text-main">Show last seen time</div>
                      <div className="text-xs text-faint mt-0.5">Show "Last seen 2h ago" when you are offline. If disabled, you'll just appear offline.</div>
                    </div>
                    <label className="flex items-center cursor-pointer shrink-0">
                      <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${(user?.privacyPrefs?.showLastSeen ?? true) ? 'bg-primary' : 'bg-border'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${(user?.privacyPrefs?.showLastSeen ?? true) ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={user?.privacyPrefs?.showLastSeen ?? true} onChange={() => handleTogglePrivacyPref('showLastSeen', user?.privacyPrefs?.showLastSeen ?? true)} />
                    </label>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Cake size={14} /> Birthday Visibility
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <div className="text-sm font-medium text-main">Share my birthday</div>
                      <div className="text-xs text-faint mt-0.5">Include me in the Birthday widget and tracker so people can celebrate with me</div>
                    </div>
                    <label className="flex items-center cursor-pointer shrink-0">
                      <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${(user?.privacyPrefs?.showBirthday ?? true) ? 'bg-primary' : 'bg-border'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${(user?.privacyPrefs?.showBirthday ?? true) ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={user?.privacyPrefs?.showBirthday ?? true} onChange={() => handleTogglePrivacyPref('showBirthday', user?.privacyPrefs?.showBirthday ?? true)} />
                    </label>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-border-subtle">
                    <div className="pr-4">
                      <div className="text-sm font-medium text-main">Show my age</div>
                      <div className="text-xs text-faint mt-0.5">Let others see what year I was born or how old I'm turning</div>
                    </div>
                    <label className="flex items-center cursor-pointer shrink-0">
                      <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${(user?.privacyPrefs?.showBirthYear ?? true) ? 'bg-primary' : 'bg-border'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${(user?.privacyPrefs?.showBirthYear ?? true) ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={user?.privacyPrefs?.showBirthYear ?? true} onChange={() => handleTogglePrivacyPref('showBirthYear', user?.privacyPrefs?.showBirthYear ?? true)} />
                    </label>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <EyeOff size={14} /> Stealth Mode
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <div className="text-sm font-medium text-main">Anonymous reactions</div>
                      <div className="text-xs text-faint mt-0.5">Others will see the reaction count increase, but won't see your name in the tooltip list</div>
                    </div>
                    <label className="flex items-center cursor-pointer shrink-0">
                      <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${!(user?.privacyPrefs?.showReactions ?? true) ? 'bg-primary' : 'bg-border'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${!(user?.privacyPrefs?.showReactions ?? true) ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={!(user?.privacyPrefs?.showReactions ?? true)} onChange={() => handleTogglePrivacyPref('showReactions', user?.privacyPrefs?.showReactions ?? true)} />
                    </label>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-border-subtle">
                    <div className="pr-4">
                      <div className="text-sm font-medium text-main">Ghost view (Skip "Seen By")</div>
                      <div className="text-xs text-faint mt-0.5">Read posts without your name appearing in the "Seen by" list</div>
                    </div>
                    <label className="flex items-center cursor-pointer shrink-0">
                      <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${!(user?.privacyPrefs?.showSeenBy ?? true) ? 'bg-primary' : 'bg-border'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${!(user?.privacyPrefs?.showSeenBy ?? true) ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={!(user?.privacyPrefs?.showSeenBy ?? true)} onChange={() => handleTogglePrivacyPref('showSeenBy', user?.privacyPrefs?.showSeenBy ?? true)} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* DATA & STORAGE TAB */}
            {activeTab === 'data' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="font-heading font-bold text-xl text-main mb-1">Data & Storage</h2>
                <p className="text-faint text-sm mb-6">Manage your local storage and activity data</p>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <HardDrive size={14} /> Local Storage
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-medium text-main">Reddit Feed Cache</div>
                      <div className="text-xs text-faint mt-0.5">Local cache of fetched Reddit posts to improve load times</div>
                    </div>
                    <button 
                      onClick={clearRedditCache}
                      className="px-4 py-2 bg-elevated border border-border-subtle text-muted hover:text-main hover:bg-base rounded-xl text-sm font-medium transition-colors"
                    >
                      Clear Cache
                    </button>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Activity size={14} /> My Activity Stats
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-elevated border border-border-subtle rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-main mb-1">{user?.postCount || 0}</div>
                      <div className="text-xs text-faint font-medium">Posts</div>
                    </div>
                    <div className="bg-elevated border border-border-subtle rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-main mb-1">{user?.commentCount || 0}</div>
                      <div className="text-xs text-faint font-medium">Comments</div>
                    </div>
                    <div className="bg-elevated border border-border-subtle rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-main mb-1">{user?.reactionCount || 0}</div>
                      <div className="text-xs text-faint font-medium">Reactions</div>
                    </div>
                    <div className="bg-elevated border border-border-subtle rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-main mb-1">{user?.savedPosts?.length || 0}</div>
                      <div className="text-xs text-faint font-medium">Saved</div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Download size={14} /> Export
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-main">Download My Data</div>
                      <div className="text-xs text-faint mt-0.5">Export your profile, preferences, and stats as JSON</div>
                    </div>
                    <button 
                      onClick={handleExportData}
                      className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                    >
                      <Download size={16} /> Export JSON
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="font-heading font-bold text-xl text-main mb-1">About</h2>
                <p className="text-faint text-sm mb-6">The Real Neighbors App</p>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4 flex items-center gap-6">
                  <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                    <MapPin size={40} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-2xl text-main">The Real Neighbors</h3>
                    <p className="text-sm text-faint mb-2">Version 2.0.0-beta</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-elevated border border-border-subtle rounded-md text-xs font-medium text-muted flex items-center gap-1"><Cpu size={12} /> React 18</span>
                      <span className="px-2 py-1 bg-elevated border border-border-subtle rounded-md text-xs font-medium text-muted flex items-center gap-1"><Database size={12} /> Firebase</span>
                      <span className="px-2 py-1 bg-elevated border border-border-subtle rounded-md text-xs font-medium text-muted flex items-center gap-1"><Palette size={12} /> Tailwind</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
                    <Sparkles size={14} /> What's New
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-main">Phase 2 Settings</div>
                        <div className="text-xs text-faint">Privacy controls, data export, and animated backgrounds.</div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-main">Reactions & Mentions</div>
                        <div className="text-xs text-faint">React to posts and tag your friends in comments.</div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-main">Reddit Integrations</div>
                        <div className="text-xs text-faint">Read-only feeds from your favorite subreddits.</div>
                      </div>
                    </li>
                  </ul>
                </div>

                {user?.role === 'admin' && (
                  <div className="bg-surface rounded-2xl border border-danger/30 p-6 mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-danger mb-4 flex items-center gap-2">
                      <ShieldAlert size={14} /> Admin Tools
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-danger/5 rounded-xl border border-danger/20">
                        <div>
                          <div className="text-sm font-bold text-danger flex items-center gap-2"><Database size={16} /> Firebase Console</div>
                          <div className="text-xs text-danger/70 mt-0.5">Manage database, auth, and storage directly</div>
                        </div>
                        <a 
                          href="https://console.firebase.google.com/" 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger/90 transition-colors"
                        >
                          Open Console ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
