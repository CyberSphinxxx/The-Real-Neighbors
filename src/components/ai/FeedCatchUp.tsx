import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Copy, X, FileText, Users, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { callDeepSeek } from '../../lib/deepseek';
import { Botbot_SYSTEM_PROMPT } from '../../lib/botbotPersonality';
import type { Post } from '../../types';
import { MobileBottomSheet } from '../ui/MobileBottomSheet';

interface FeedCatchUpProps {
  isModal?: boolean;
  onClose?: () => void;
}

const TIME_RANGES = [
  { id: '6h', label: '6 hours', ms: 6 * 60 * 60 * 1000 },
  { id: '24h', label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  { id: '3d', label: '3 days', ms: 3 * 24 * 60 * 60 * 1000 },
  { id: '7d', label: '7 days', ms: 7 * 24 * 60 * 60 * 1000 }
];

const getCache = () => {
  try {
    const cached = localStorage.getItem('feed_catchup_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.date === new Date().toDateString()) {
        return parsed.ranges || {};
      }
    }
  } catch(e) { /* localStorage read may fail if quota is exceeded or API unavailable */ }
  return {};
};

const saveToCache = (rangeId: string, data: any) => {
  const cache = getCache();
  cache[rangeId] = data;
  try {
    localStorage.setItem('feed_catchup_cache', JSON.stringify({
      date: new Date().toDateString(),
      ranges: cache
    }));
  } catch(e) { /* localStorage write may fail if quota is exceeded or API unavailable */ }
};

export const FeedCatchUp: React.FC<FeedCatchUpProps> = ({ isModal = false, onClose }) => {
  const navigate = useNavigate();
  const initialCache = getCache();
  const initialRange = TIME_RANGES.find(r => initialCache[r.id]) || TIME_RANGES[1];
  const [selectedRange, setSelectedRange] = useState(initialRange);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(initialCache[initialRange.id]?.summary || '');
  const [stats, setStats] = useState(initialCache[initialRange.id]?.stats || { postCount: 0, uniqueAuthors: 0, totalReactions: 0 });
  const [noPosts, setNoPosts] = useState(initialCache[initialRange.id]?.noPosts || false);

  const handleRangeChange = (range: any) => {
    setSelectedRange(range);
    const cache = getCache();
    if (cache[range.id]) {
      setSummary(cache[range.id].summary);
      setStats(cache[range.id].stats);
      setNoPosts(cache[range.id].noPosts);
    } else {
      setSummary('');
      setNoPosts(false);
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSummary('');
    setNoPosts(false);
    
    try {
      const cutoff = Date.now() - selectedRange.ms;
      const q = query(
        collection(db, 'posts'),
        where('createdAt', '>=', cutoff),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
      
      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(d => d.data() as Post);
      
      if (posts.length === 0) {
        setNoPosts(true);
        saveToCache(selectedRange.id, { summary: '', stats: { postCount: 0, uniqueAuthors: 0, totalReactions: 0 }, noPosts: true });
        setSummary('');
        setIsGenerating(false);
        return;
      }

      // Calculate stats
      const uniqueAuthors = new Set(posts.map(p => p.authorId)).size;
      const totalReactions = posts.reduce((sum, p) => {
        return sum + Object.values(p.reactions || {}).flat().length;
      }, 0);
      
      const newStats = { postCount: posts.length, uniqueAuthors, totalReactions };
      setStats(newStats);

      
      // Fetch user data for names
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap = new Map();
      usersSnap.docs.forEach(d => usersMap.set(d.id, d.data().displayName));
      
      const postStrings = posts.map((p, i) => {
        const authorName = usersMap.get(p.authorId) || 'Someone';
        const reactCount = Object.values(p.reactions || {}).flat().length;
        const commentCount = p.comments?.length || 0;
        return `${i+1}. ${authorName} posted: "${p.content.slice(0,120)}"
   ${p.imageUrl ? '(with an image)' : ''}
   ${p.linkUrl ? '(shared a link)' : ''}
   Reactions: ${reactCount} total
   Comments: ${commentCount}`;
      }).join('\n');

      const prompt = `Summarize what happened in our friend group's feed in the last ${selectedRange.label}. Here are the posts:

${postStrings}

Write a casual Taglish summary like you're a friend updating another friend who missed out. Use Markdown formatting (like **bolding** names). You can use bullet points for key highlights. Keep it under 5 sentences. Be funny and specific.`;

      const response = await callDeepSeek([
        { role: 'system', content: Botbot_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]);
      
      setSummary(response.content);
      saveToCache(selectedRange.id, { summary: response.content, stats: newStats, noPosts: false });
    } catch (error) {
      console.error('Failed to generate catch-up:', error);
      toast.error('Failed to generate summary.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    toast.success('Summary copied!');
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Basic bold parser
      const parts = line.split(/(\*\*.*?\*\*)/g);
      
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const content = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-semibold text-main">{part.slice(2, -2)}</strong>;
        }
        return isBullet && j === 0 ? part.replace(/^[-*]\s/, '') : part;
      });

      if (isBullet) {
        return (
          <li key={i} className="ml-4 mb-2">
            {content}
          </li>
        );
      }

      if (line.trim() === '') return <br key={i} />;

      return (
        <p key={i} className="mb-2">
          {content}
        </p>
      );
    });
  };

  const content = (
    <div className={`w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 ${isModal ? '' : 'pb-8'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-heading font-bold text-xl flex items-center gap-2 text-main">
            📰 Feed Catch-Up
          </h2>
          <p className="text-faint text-sm mt-1">Para updated ka kahit tamad kang mag-scroll</p>
        </div>
        {isModal && (
          <button onClick={onClose} className="p-1.5 rounded-full text-muted hover:bg-elevated hover:text-main transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-border-subtle p-5">
        <label className="block text-sm font-medium text-main mb-3">Catch me up on the last:</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {TIME_RANGES.map(range => (
            <button
              key={range.id}
              onClick={() => handleRangeChange(range)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                selectedRange.id === range.id
                  ? 'bg-primary/15 border-primary text-primary'
                  : 'border-border text-muted bg-surface hover:text-main hover:border-border-subtle'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-primary text-on-primary rounded-full py-2.5 font-medium flex items-center justify-center gap-2 transition-all hover:bg-primary-hover disabled:opacity-50"
        >
          {isGenerating ? <Sparkles className="animate-pulse" size={18} /> : <Sparkles size={18} />}
          Catch Me Up 📰
        </button>
      </div>

      {isGenerating && !summary && !noPosts && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 flex flex-col items-center justify-center gap-3 h-48 animate-pulse">
          <Sparkles className="text-primary animate-bounce" size={24} />
          <p className="text-faint text-sm text-center italic">Reading posts... 🤔</p>
        </div>
      )}

      {noPosts && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-8 flex flex-col items-center text-center">
          <span className="text-4xl mb-3">💀</span>
          <p className="text-main font-semibold mb-1">Walang nangyari. Tahimik ang grupo.</p>
          <p className="text-muted text-sm">Try a longer time range.</p>
        </div>
      )}

      {summary && !isGenerating && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xs">
              NB
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-faint uppercase tracking-wider">Botbot says:</span>
              <Sparkles size={12} className="text-primary" />
            </div>
          </div>
          
          <div className="text-base text-main leading-relaxed mb-6">
            {renderMarkdown(summary)}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-border-subtle">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="bg-base rounded-full px-2.5 py-1 text-xs text-muted flex items-center gap-1.5 border border-border-subtle">
                <FileText size={12} />
                <span>{stats.postCount} Posts</span>
              </div>
              <div className="bg-base rounded-full px-2.5 py-1 text-xs text-muted flex items-center gap-1.5 border border-border-subtle">
                <Users size={12} />
                <span>{stats.uniqueAuthors} Members</span>
              </div>
              <div className="bg-base rounded-full px-2.5 py-1 text-xs text-muted flex items-center gap-1.5 border border-border-subtle">
                <Heart size={12} />
                <span>{stats.totalReactions} Reactions</span>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={handleCopy}
                className="p-2 rounded-full hover:bg-elevated text-muted hover:text-main transition-colors border border-transparent hover:border-border-subtle shrink-0"
                title="Copy summary"
              >
                <Copy size={14} />
              </button>
              {isModal ? (
                <button
                  onClick={() => {
                    if (onClose) onClose();
                    navigate('/ai?tool=feed');
                  }}
                  className="text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  View in Botbot &rarr;
                </button>
              ) : (
                <Link to="/feed" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1 whitespace-nowrap shrink-0">
                  View feed &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={true} onClose={onClose || (() => {})} maxHeight="90vh">
          <div className="flex flex-col w-full bg-base overflow-y-auto custom-scrollbar p-4">
            {content}
          </div>
        </MobileBottomSheet>
      );
    }
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-base rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
