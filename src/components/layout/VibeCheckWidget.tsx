import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { callDeepSeek } from '../../lib/deepseek';
import { Botbot_SYSTEM_PROMPT, getBotbotContextPrompt } from '../../lib/botbotPersonality';
import { useBotbotContext } from '../../hooks/useBotbotContext';
import { useAuthStore } from '../../stores/authStore';

interface VibeCheckResult {
  score: number;
  mood: string;
  description: string;
  forecast: string;
  generatedAt: string;
}

export const VibeCheckWidget: React.FC = () => {
  const { user } = useAuthStore();
  const { fetchContext } = useBotbotContext();
  const [data, setData] = useState<VibeCheckResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  const generateVibeCheck = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    try {
      const contextData = await fetchContext();
      const systemPrompt = Botbot_SYSTEM_PROMPT + '\n\n' + getBotbotContextPrompt(contextData);

      const prompt = `Analyze the current vibe of our friend group based on the recent activity and give a vibe check report.

Respond with ONLY a JSON object in this exact format, no other text:
{
  "score": 7.5,
  "mood": "Gaming Arc 🎮",
  "description": "Two sentences max about the current group energy.",
  "forecast": "One funny prediction for what will happen today."
}

Rules:
- score is a number from 1.0 to 10.0 (one decimal)
- mood is a short label with ONE relevant emoji at the end
- description is casual Taglish, max 2 sentences
- forecast is funny and specific, references the group's actual activity
- Return ONLY valid JSON, no markdown, no explanation`;

      const response = await callDeepSeek([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);
      
      let parsed: VibeCheckResult;
      try {
        // Strip markdown backticks if present
        let jsonStr = response.content;
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');
        }
        parsed = JSON.parse(jsonStr.trim());
      } catch (e) {
        console.error('Failed to parse vibe check JSON:', e);
        parsed = {
          score: 7.0,
          mood: "Chill Mode 😌",
          description: "Ayaw i-analyze ng Botbot ngayon. Try again.",
          forecast: "Baka may mag-post ng meme mamaya.",
          generatedAt: new Date().toISOString()
        };
      }
      
      parsed.generatedAt = new Date().toISOString();
      setData(parsed);
      
      if (user) {
        localStorage.setItem(`vibeCheck_date_${user.id}`, getTodayDateString());
        localStorage.setItem(`vibeCheck_data_${user.id}`, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Error generating vibe check:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const today = getTodayDateString();
    const cachedDate = localStorage.getItem(`vibeCheck_date_${user.id}`);
    const cachedDataStr = localStorage.getItem(`vibeCheck_data_${user.id}`);
    
    if (cachedDate === today && cachedDataStr) {
      try {
        setData(JSON.parse(cachedDataStr));
        return;
      } catch (e) {
        console.error('Error parsing cached vibe check:', e);
      }
    }
    
    // First load of the day or no data
    generateVibeCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
