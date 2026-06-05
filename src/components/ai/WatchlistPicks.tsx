import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { callDeepSeek } from '../../lib/deepseek';
import { Botbot_SYSTEM_PROMPT } from '../../lib/botbotPersonality';
import { Loader2, Sparkles, Tv, Film, MonitorPlay } from 'lucide-react';
import { getAvatarColor } from '../../utils/avatarColor';
import type { User as UserType, WatchlistEntry } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  users: UserType[];
  initialTargetUserId?: string;
}

interface Pick {
  title: string;
  year: string;
  type: 'movie' | 'tv' | 'anime';
  reason: string;
}

export const WatchlistPicks: React.FC<Props> = ({ users, initialTargetUserId }) => {
  const { user } = useAuthStore();
  const [targetUserId, setTargetUserId] = useState<string>(initialTargetUserId || user?.id || '');
  const [filterType, setFilterType] = useState<'all' | 'anime' | 'movies_tv'>('all');
  const [mood, setMood] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [botMessage, setBotMessage] = useState('');

  const handleGenerate = async () => {
    if (!targetUserId) return;
    setIsGenerating(true);
    setPicks([]);
    setBotMessage('');

    try {
      // Fetch user's existing watchlist to avoid duplicates and understand taste
      const q = query(collection(db, 'watchlists'), where('userId', '==', targetUserId));
      const snapshot = await getDocs(q);
      const watchlist = snapshot.docs.map(d => d.data() as WatchlistEntry);
      
      const finished = watchlist.filter(w => w.status === 'finished');
      
      const finishedTitles = finished.map(w => w.title).slice(0, 30).join(', '); // limit to avoid massive tokens
      const existingTitles = watchlist.map(w => w.title).join(', ');
      
      const targetUser = users.find(u => u.id === targetUserId);
      const name = targetUser?.displayName || 'this member';

      const typeInstruction = 
        filterType === 'anime' ? 'Only recommend Anime.' :
        filterType === 'movies_tv' ? 'Only recommend Movies and TV Shows (NO anime).' :
        'You can recommend Movies, TV Shows, and Anime.';

      const userPrompt = `Generate 5 watchlist recommendations for ${name}.
${mood ? `Current mood/vibe they want: "${mood}"` : ''}
${typeInstruction}

Context about what they like (finished titles):
${finishedTitles || 'No finished titles yet.'}

DO NOT recommend any of these titles because they are already on their watchlist:
${existingTitles || 'None'}

Return ONLY a valid JSON object matching this schema exactly:
{
  "botMessage": "A short, casual Taglish message from Botbot introducing the picks (max 2 sentences)",
  "picks": [
    {
      "title": "Title of the show/movie",
      "year": "Release year",
      "type": "movie" | "tv" | "anime",
      "reason": "1 short sentence explaining why they will like it based on their taste or mood (Taglish)"
    }
  ]
}`;

      const response = await callDeepSeek(
        [
          { role: 'system', content: Botbot_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.9, maxTokens: 1000 }
      );

      let content = response.content;
      // Clean markdown code blocks if any
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(content);
      
      if (parsed.botMessage) setBotMessage(parsed.botMessage);
      if (parsed.picks && Array.isArray(parsed.picks)) {
        setPicks(parsed.picks.slice(0, 5)); // ensure max 5
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate picks. Maybe Botbot is sleepy.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anime': return <MonitorPlay size={16} className="text-blue-500" />;
      case 'movie': return <Film size={16} className="text-orange-500" />;
      case 'tv': return <Tv size={16} className="text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-main flex items-center gap-2">
          🎬 Watchlist Picks
        </h1>
        <p className="text-muted text-sm mt-1">Botbot mag-rereko ng panoorin pre</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-main mb-2">Generate picks for:</label>
          <div className="flex flex-wrap gap-2">
            {users.map(u => {
              const isSelected = targetUserId === u.id;
              const avatarBg = u.avatarUrl ? undefined : getAvatarColor(u.displayName);
              return (
                <button
                  key={u.id}
                  onClick={() => setTargetUserId(u.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border-subtle bg-base text-muted hover:border-primary/50 hover:text-main'
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
                  {u.id === user?.id ? 'Me' : u.displayName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-main mb-2">What type?</label>
          <div className="flex gap-2">
            {[
              { id: 'all', label: '🎬 All' },
              { id: 'anime', label: '🎌 Anime only' },
              { id: 'movies_tv', label: '📺 Movies & TV' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  filterType === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-border-subtle bg-base text-muted hover:text-main'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-main mb-2">Mood in 1 sentence? (Optional)</label>
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="e.g. Gusto ko umiyak sa gabi"
            className="w-full bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !targetUserId}
          className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {isGenerating ? 'Analyzing taste...' : 'Get Botbot Picks'}
        </button>
      </div>

      {botMessage && (
        <div className="mb-4 flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-on-primary">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="font-bold text-main text-sm">Botbot 🤖</span>
            <p className="text-main mt-1 text-sm whitespace-pre-wrap">{botMessage}</p>
          </div>
        </div>
      )}

      {picks.length > 0 && (
        <div className="space-y-3 pb-8">
          {picks.map((pick, i) => (
            <div key={i} className="bg-surface border border-border-subtle rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-main text-lg leading-tight flex items-center gap-2">
                    {pick.title}
                    <span className="text-xs font-normal text-muted bg-base px-2 py-0.5 rounded-full border border-border-subtle">
                      {pick.year}
                    </span>
                  </h3>
                </div>
                <div className="bg-base p-1.5 rounded-lg border border-border-subtle">
                  {getTypeIcon(pick.type)}
                </div>
              </div>
              <p className="text-muted text-sm">{pick.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
