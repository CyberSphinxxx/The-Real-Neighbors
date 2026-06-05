import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { callDeepSeek } from '../../lib/deepseek';
import { Botbot_SYSTEM_PROMPT } from '../../lib/botbotPersonality';

const STYLES = [
  { id: 'Funny', label: '😂 Funny' },
  { id: 'Serious', label: '⚖️ Serious' },
  { id: 'Random', label: '🎲 Random' }
];

interface GeneratedPoll {
  question: string;
  options: string[];
}

export const PollGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedPoll | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim() || isGenerating) return;
    setIsGenerating(true);
    setResult(null);

    try {
      const prompt = `Create a poll for a Filipino friend group about: ${topic.trim()}
Style: ${selectedStyle.id}

Respond with ONLY a JSON object:
{
  "question": "The poll question ending with ?",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
}

Rules:
- question should be direct and engaging
- 3-4 options (4 max)
- Options should be distinct and cover the main choices
- For Funny style: make options witty but real choices
- For Serious style: straightforward honest options
- For Random style: at least one unexpected option
- Write in Taglish naturally
- Options max 40 chars each
- Return ONLY valid JSON`;

      const response = await callDeepSeek([
        { role: 'system', content: Botbot_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]);
      
      let parsed: GeneratedPoll;
      try {
        let jsonStr = response.content;
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');
        parsed = JSON.parse(jsonStr.trim());
      } catch (e) {
        console.error('Failed to parse poll JSON:', e);
        throw new Error('Failed to parse response');
      }

      setResult(parsed);
    } catch (error) {
      console.error('Error generating poll:', error);
      toast.error('Failed to generate poll. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUsePoll = () => {
    if (!result) return;
    navigate('/feed', { state: { openPoll: true, pollData: result } });
  };

  const charsLeft = 150 - topic.length;

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-8">
      <div>
        <h2 className="font-heading font-bold text-xl flex items-center gap-2 text-main">
          🗳️ Poll Generator
        </h2>
        <p className="text-faint text-sm mt-1">Huwag na mag-isip, bahala si Botbot</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border-subtle p-6">
        <label className="block text-sm font-medium text-main mb-2">What's the poll about?</label>
        <div className="relative">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, 150))}
            className="w-full bg-elevated rounded-xl border border-border-subtle px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary transition-colors text-main custom-scrollbar"
            rows={2}
            placeholder="e.g., saan kayo kumain, anong panoorin natin, sino ang may kasalanan..."
          />
          <div className="absolute bottom-3 right-3 text-xs text-faint">
            <span className={charsLeft <= 20 ? 'text-danger font-medium' : ''}>{charsLeft}</span>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs text-muted mb-2">Poll style:</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  selectedStyle.id === style.id
                    ? 'bg-primary/15 border-primary text-primary'
                    : 'border-border text-muted bg-surface hover:text-main hover:border-border-subtle'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!topic.trim() || isGenerating}
          className="w-full mt-5 bg-primary text-on-primary rounded-full py-2.5 font-medium flex items-center justify-center gap-2 transition-all hover:bg-primary-hover disabled:opacity-50"
        >
          {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {isGenerating ? 'Generating...' : 'Generate Poll 🗳️'}
        </button>
      </div>

      {isGenerating && !result && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 flex flex-col items-center justify-center gap-3 h-40 animate-pulse">
          <Sparkles className="text-primary animate-bounce" size={24} />
          <p className="text-faint text-sm text-center italic">Crafting the perfect questions... 🤔</p>
        </div>
      )}

      {result && !isGenerating && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-5 animate-in zoom-in-95 duration-200">
          <h3 className="font-semibold text-base text-main mb-3">{result.question}</h3>
          
          <div className="flex flex-col mb-4">
            {result.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-border-subtle last:border-0">
                <span className="text-primary text-lg leading-none">•</span>
                <span className="text-sm text-main">{opt}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
            >
              <RefreshCw size={14} /> Regenerate
            </button>
            <button
              onClick={handleUsePoll}
              className="bg-primary text-on-primary rounded-full px-4 py-1.5 text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Use this poll →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
