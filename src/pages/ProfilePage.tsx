import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { updateDoc } from '../lib/firestore';
import { User, LogOut, Palette, Moon, Monitor, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [showAge, setShowAge] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [theme, setTheme] = useState<'default' | 'dark' | 'amoled'>('default');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setAvatarUrl(user.avatarUrl || '');
      setAccentColor(user.accentColor || '#3b82f6');
      setShowAge(user.showAge ?? true);
    }
  }, [user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as any || 'default';
    setTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: 'default' | 'dark' | 'amoled') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    document.documentElement.classList.remove('dark', 'amoled');
    if (newTheme !== 'default') {
      document.documentElement.classList.add(newTheme);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;

    setIsSaving(true);
    try {
      await updateDoc('users', [user.id], {
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || null,
        accentColor: accentColor,
        showAge: showAge
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-heading font-bold text-main tracking-tight flex items-center gap-3">
          <User className="text-primary" /> Profile & Settings
        </h1>
        <p className="text-sm text-muted mt-1">Manage your identity and app preferences.</p>
      </div>

      <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div 
              className="w-20 h-20 rounded-full bg-primary/10 border-2 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden flex-shrink-0"
              style={{ borderColor: accentColor }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-main mb-1.5">Avatar URL (Optional)</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-base border border-border-subtle rounded-xl px-4 py-2 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-main mb-1.5">Display Name *</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-base border border-border-subtle rounded-xl px-4 py-2.5 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border-subtle">
            <div>
              <label className="text-sm font-semibold text-main mb-3 flex items-center gap-2">
                <Palette size={16} /> Personal Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-sm text-muted font-mono uppercase">{accentColor}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-main mb-3 flex items-center gap-2">
                <EyeOff size={16} /> Privacy
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${showAge ? 'bg-primary' : 'bg-border'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${showAge ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-medium text-main group-hover:text-primary transition-colors">
                  Show my exact age on birthdays
                </span>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-border-subtle">
            <button
              type="submit"
              disabled={isSaving || !displayName.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
        <h3 className="font-heading font-bold text-main mb-4 flex items-center gap-2">
          <Moon size={18} className="text-primary" /> App Theme
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleThemeChange('default')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold transition-all ${
              theme === 'default' ? 'border-primary bg-primary/5 text-primary' : 'border-border-subtle text-muted hover:border-border hover:text-main'
            }`}
          >
            <Monitor size={18} /> Light
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold transition-all ${
              theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-border-subtle text-muted hover:border-border hover:text-main'
            }`}
          >
            <Moon size={18} /> Dark
          </button>
          <button
            onClick={() => handleThemeChange('amoled')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold transition-all bg-black ${
              theme === 'amoled' ? 'border-primary text-primary' : 'border-border-subtle text-white/70 hover:border-border hover:text-white'
            }`}
          >
            AMOLED
          </button>
        </div>
      </div>

      <div className="pt-4 flex justify-center">
        <button
          onClick={() => signOut(auth)}
          className="flex items-center gap-2 text-danger hover:bg-danger/10 px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
