import React, { useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { callDeepSeek } from '../../lib/deepseek';
import { Botbot_SYSTEM_PROMPT } from '../../lib/botbotPersonality';
import { Loader2, Music2, Sparkles } from 'lucide-react';
import { PlaylistCard } from '../playlist/PlaylistCard';
import type { Playlist, User } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  users: User[];
}

export const PlaylistMatcher: React.FC<Props> = ({ users }) => {
  const [situation, setSituation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [matchedPlaylist, setMatchedPlaylist] = useState<Playlist | null>(null);
  const [botMessage, setBotMessage] = useState('');

  const handleMatch = async () => {
    if (!situation.trim()) return;
    setIsGenerating(true);
    setMatchedPlaylist(null);
    setBotMessage('');

    try {
      const snapshot = await getDocs(collection(db, 'playlists'));
      const playlists = snapshot.docs.map(d => d.data() as Playlist);

      if (playlists.length === 0) {
        toast.error("Walang playlists sa server bro!");
        setIsGenerating(false);
        return;
      }

      const playlistsContext = playlists.map(p => 
        `ID: ${p.id} | Title: ${p.title} | Genre/Vibe: ${p.vibeTag?.label || 'None'}`
      ).join('\n');

      const userPrompt = `A user wants a playlist for this situation/mood: "${situation}"

Available playlists in our database:
${playlistsContext}

Pick exactly ONE playlist ID that best matches their situation.

Return ONLY a valid JSON object matching this schema exactly:
{
  "botMessage": "A casual Taglish message from Botbot explaining why this playlist is perfect (max 2 sentences)",
  "playlistId": "the ID of the chosen playlist"
}`;

      const response = await callDeepSeek(
        [
          { role: 'system', content: Botbot_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.8, maxTokens: 800 }
      );

      let content = response.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(content);
      
      const found = playlists.find(p => p.id === parsed.playlistId);
      
      if (found) {
        setBotMessage(parsed.botMessage);
        setMatchedPlaylist(found);
      } else {
        // Fallback to random if AI hallucinates an ID
        const randomIdx = Math.floor(Math.random() * playlists.length);
        setMatchedPlaylist(playlists[randomIdx]);
        setBotMessage("Hindi ko mahanap yung exact na gusto ko, pero eto close enough bro! 🎧");
      }
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to match playlist.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-main flex items-center gap-2">
          🎧 Playlist Matcher
        </h1>
        <p className="text-muted text-sm mt-1">Anong vibe ba hanap natin ngayon?</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-6 shadow-sm">
        <label className="block text-sm font-medium text-main mb-2">What's the situation?</label>
        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="e.g. Nagddrive pauwi sa gabi habang umuulan..."
          className="w-full bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-24 mb-4"
        />

        <button
          onClick={handleMatch}
          disabled={isGenerating || !situation.trim()}
          className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Music2 size={18} />}
          {isGenerating ? 'Finding the perfect vibe...' : 'Match my mood'}
        </button>
      </div>

      {matchedPlaylist && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-4 flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-on-primary">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="font-bold text-main text-sm">Botbot 🤖</span>
              <p className="text-main mt-1 text-sm whitespace-pre-wrap">{botMessage}</p>
            </div>
          </div>

          <div className="max-w-[300px]">
            <PlaylistCard playlist={matchedPlaylist} allUsers={users} />
          </div>
        </div>
      )}
    </div>
  );
};
