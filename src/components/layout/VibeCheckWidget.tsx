import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getDoc, setDoc } from '../../lib/firestore';

interface VibeCheckResult {
  score: number;
  mood: string;
  description: string;
  forecast: string;
  generatedAt: string;
}

const PREDEFINED_VIBES: Omit<VibeCheckResult, 'generatedAt'>[] = [
  { score: 9.5, mood: "Peak Energy ⚡", description: "The group chat is on fire today. Pure chaos in the best way possible.", forecast: "Someone is going to drop a legendary meme." },
  { score: 8.0, mood: "Chill Mode 😌", description: "Everyone is taking it easy. Good vibes, relaxed energy.", forecast: "Random deep talks late at night." },
  { score: 6.5, mood: "Ghost Town 👻", description: "Where is everybody? The silence is deafening.", forecast: "Someone will reply 'slr' 5 hours late." },
  { score: 7.5, mood: "Gaming Arc 🎮", description: "Locking in. The competitive spirit is high today.", forecast: "Rage quit incoming in 3... 2... 1..." },
  { score: 8.5, mood: "Yapping Session 🗣️", description: "Non-stop chika and storytelling. We have so much to say.", forecast: "A voice note longer than a podcast." },
  { score: 9.0, mood: "Food Cravings 🍕", description: "Everyone is just talking about what to eat.", forecast: "Someone is definitely ordering fast food right now." },
  { score: 5.0, mood: "Brain Fried 🧠", description: "Pagod na ang lahat. Single brain cell functioning.", forecast: "Typo strings and confused replies." },
  { score: 8.8, mood: "Productive Era 📈", description: "Wait, are we actually doing our tasks? Rare W.", forecast: "Someone will flex their completed task." },
  { score: 7.0, mood: "Nostalgia Trip 🕰️", description: "Looking back at old photos and inside jokes.", forecast: "Prepare for 'miss u guys' messages." },
  { score: 9.8, mood: "Hype Train 🚂", description: "Maximum excitement! We're planning something big.", forecast: "Plans will be made (and hopefully not cancelled)." }
];

export const VibeCheckWidget: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<VibeCheckResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const initialized = useRef(false);

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  const generateVibeCheck = useCallback(async () => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    
    try {
      // Simulate slight delay for effect
      await new Promise(resolve => setTimeout(resolve, 800));

      const randomVibe = PREDEFINED_VIBES[Math.floor(Math.random() * PREDEFINED_VIBES.length)];
      
      const parsed: VibeCheckResult = {
        ...randomVibe,
        generatedAt: new Date().toISOString()
      };
      setData(parsed);
      
      if (user) {
        try {
          await setDoc('groupStats', ['vibeCheck'], {
            date: getTodayDateString(),
            data: parsed
          });
        } catch (e) {
          console.error('Error saving global vibe check:', e);
        }
      }
    } catch (error) {
      console.error('Error generating vibe check:', error);
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      initialized.current = false;
      return;
    }
    
    if (initialized.current) return;
    initialized.current = true;
    
    const fetchGlobalVibeCheck = async () => {
      try {
        const today = getTodayDateString();
        const globalVibe = await getDoc<{ date: string; data: VibeCheckResult }>('groupStats', ['vibeCheck']);
        
        if (globalVibe && globalVibe.date === today && globalVibe.data) {
          setData(globalVibe.data);
          return;
        }

        // First load of the day or no data globally
        generateVibeCheck();
      } catch (error) {
        console.error('Error checking global vibe check:', error);
        generateVibeCheck();
      }
    };

    fetchGlobalVibeCheck();
  }, [user, generateVibeCheck]);

  const canRefresh = data ? (Date.now() - new Date(data.generatedAt).getTime()) > 60 * 60 * 1000 : false;

  const getScoreColor = (score: number) => {
    if (score < 5) return 'var(--color-danger)';
    if (score < 7) return 'var(--color-warning)';
    if (score < 9) return 'var(--color-primary)';
    return 'var(--color-success)';
  };

  if (isGenerating && !data) {
    return (
      <div className="bg-surface border border-border-subtle shadow-sm rounded-xl p-4 flex flex-col items-center justify-center min-h-[140px] animate-pulse">
        <Sparkles size={16} className="text-primary animate-bounce mb-2" />
        <span className="text-xs text-faint">Checking the group vibe... 🔍</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-surface border border-border-subtle shadow-sm rounded-xl p-4 relative overflow-hidden group shrink-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-1.5 text-muted">
          <Sparkles size={12} />
          <span className="text-[10px] font-bold uppercase tracking-wider">VIBE CHECK</span>
        </div>
        <span className="text-[10px] text-faint">
          {new Date(data.generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Main Score Area */}
      <div className="flex flex-col items-center justify-center mb-3">
        <div className="flex items-baseline gap-1">
          <span 
            className="font-heading font-bold text-4xl" 
            style={{ color: getScoreColor(data.score) }}
          >
            {data.score.toFixed(1)}
          </span>
          <span className="text-muted text-lg font-medium">/10</span>
        </div>
        <span className="font-semibold text-sm text-main text-center mt-1">
          {data.mood}
        </span>
      </div>

      {/* Description */}
      <p className="text-muted text-xs text-center line-clamp-2 px-2">
        {data.description}
      </p>

      {/* Forecast */}
      <div className="border-t border-border-subtle mt-4 pt-3">
        <p className="text-faint text-[10px] uppercase font-bold tracking-wider mb-1">Today's forecast:</p>
        <p className="text-sm text-main italic">"{data.forecast}"</p>
      </div>

      {/* Refresh Button */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => generateVibeCheck()}
          disabled={!canRefresh || isGenerating}
          className="flex items-center gap-1 p-1 text-faint hover:text-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-surface/80 backdrop-blur rounded"
          title={canRefresh ? "Refresh vibe check" : "Can only refresh once an hour"}
        >
          <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
          <span className="text-[10px]">Refresh</span>
        </button>
      </div>
    </div>
  );
};
