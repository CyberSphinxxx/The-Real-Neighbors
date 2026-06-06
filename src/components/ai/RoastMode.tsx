import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getDocs, query, collection, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { callDeepSeek } from '../../lib/deepseek';
import { Botbot_SYSTEM_PROMPT } from '../../lib/botbotPersonality';
import { Loader2, Flame, AlertTriangle } from 'lucide-react';
import { getAvatarColor } from '../../utils/avatarColor';
import type { User as UserType, Post, WatchlistEntry } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  users: UserType[];
}

export const RoastMode: React.FC<Props> = ({ users }) => {
  const { user } = useAuthStore();
  const [targetUserId, setTargetUserId] = useState<string>(user?.id || '');
  const [intensity, setIntensity] = useState<'gentle' | 'medium' | 'savage'>('medium');
  const [hasConsent, setHasConsent] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [roastResult, setRoastResult] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const handleRoast = async () => {
    if (!targetUserId || (targetUserId !== user?.id && !hasConsent)) {
      toast.error('You need their permission first bro!');
      return;
    }
    
    setIsGenerating(true);
    setRoastResult('');

    try {
      const targetUser = users.find(u => u.id === targetUserId);
      const name = targetUser?.displayName || 'this member';

      // Fetch context
      const postsQ = query(collection(db, 'posts'), where('authorId', '==', targetUserId), orderBy('createdAt', 'desc'), limit(5));
      const watchQ = query(collection(db, 'watchlists'), where('userId', '==', targetUserId), where('status', '==', 'finished'), limit(5));
      
      const [pSnap, wSnap] = await Promise.all([getDocs(postsQ), getDocs(watchQ)]);
      const posts = pSnap.docs.map(d => (d.data() as Post).content).filter(Boolean);
      const watch = wSnap.docs.map(d => (d.data() as WatchlistEntry).title);

      const userPrompt = `You are Botbot. Roast ${name} in Taglish.
Intensity level: ${intensity}

Here is some context about them:
Recent posts:
${posts.length ? posts.join('\\n') : 'No recent posts. (Boring much?)'}

Recent movies/anime they watched:
${watch.length ? watch.join(', ') : 'Nothing watched recently.'}

Rules:
- Keep it under 4 sentences.
- Make it funny and directly reference their posts or watchlist if provided.
- Do NOT output JSON. Just output the roast text directly.`;

      const response = await callDeepSeek(
        [
          { role: 'system', content: Botbot_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.9, maxTokens: 400 }
      );

      setRoastResult(response.content.trim());
      
    } catch (error) {
      console.error(error);
      toast.error('Botbot choked. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeedback = async (emoji: string) => {
    if (!roastResult) return;
    setIsReplying(true);
    try {
      const userPrompt = `I reacted with "${emoji}" to your roast: "${roastResult}"
Give a 1-sentence witty comeback to my reaction in casual Taglish. Just the text, no quotes.`;

      const response = await callDeepSeek(
        [
          { role: 'system', content: Botbot_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.85, maxTokens: 100 }
      );
      toast.success(response.content.trim(), { duration: 4000, icon: '🤖' });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Botbot choked on your comeback. Try again!');
    } finally {
      setIsReplying(false);
    }
  };

  const isSelfRoast = targetUserId === user?.id;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-8">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-danger flex items-center gap-2">
          🔥 Roast Mode
        </h1>
        <p className="text-muted text-sm mt-1">Ready ka na ba masaktan?</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-6 shadow-sm">
        <label className="block text-sm font-medium text-main mb-2">Who are we roasting?</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {users.map(u => {
            const isSelected = targetUserId === u.id;
            const avatarBg = u.avatarUrl ? undefined : getAvatarColor(u.displayName);
            return (
              <button
                key={u.id}
                onClick={() => {
                  setTargetUserId(u.id);
                  if (u.id === user?.id) setHasConsent(true);
                  else setHasConsent(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  isSelected ? 'border-danger bg-danger/10 text-danger' : 'border-border-subtle bg-base text-muted hover:border-danger/50 hover:text-main'
                }`}
              >
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden"
                  style={{ background: avatarBg }}
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    u.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                {u.id === user?.id ? 'Me (Self-Roast)' : u.displayName}
              </button>
            );
          })}
        </div>

        {!isSelfRoast && (
          <div className="mb-4 bg-danger/10 border border-danger/20 rounded-xl p-3 flex items-start gap-2 animate-in slide-in-from-top-2">
            <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-danger font-medium">Consent Required</p>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hasConsent}
                  onChange={(e) => setHasConsent(e.target.checked)}
                  className="rounded border-danger/30 text-danger focus:ring-danger"
                />
                <span className="text-sm text-main">They explicitly allowed me to do this</span>
              </label>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-main mb-2">Intensity Level</label>
          <div className="flex gap-2">
            {[
              { id: 'gentle', label: '😊 Gentle' },
              { id: 'medium', label: '🔥 Medium' },
              { id: 'savage', label: '💀 Savage' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setIntensity(t.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  intensity === t.id ? 'border-danger bg-danger/10 text-danger' : 'border-border-subtle bg-base text-muted hover:text-main'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRoast}
          disabled={isGenerating || !targetUserId || (!isSelfRoast && !hasConsent)}
          className="w-full py-3 rounded-xl bg-danger text-white font-bold hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-danger transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Flame size={18} />}
          {isGenerating ? 'Cooking...' : 'Roast!'}
        </button>
      </div>

      {roastResult && (
        <div className="bg-surface rounded-2xl border border-danger/30 p-6 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-danger flex items-center justify-center text-white">
              <Flame size={16} />
            </div>
            <span className="font-bold text-main">Botbot says:</span>
          </div>
          
          <p className="text-lg text-main leading-relaxed whitespace-pre-wrap font-medium italic">
            "{roastResult}"
          </p>
          
          <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between">
            <span className="text-sm text-muted">React to reply:</span>
            <div className="flex gap-2">
              {['😂', '🤌', '🥱'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleFeedback(emoji)}
                  disabled={isReplying}
                  className="w-10 h-10 rounded-full bg-base border border-border-subtle flex items-center justify-center hover:bg-elevated hover:scale-110 transition-all text-xl disabled:opacity-50"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
