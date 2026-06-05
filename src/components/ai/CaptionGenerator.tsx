import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, Copy, Send, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { callDeepSeek } from '../../lib/deepseek';
import { Botbot_SYSTEM_PROMPT } from '../../lib/botbotPersonality';

const TONES = [
  { id: 'Funny', label: '😂 Funny' },
  { id: 'Chill', label: '😌 Chill' },
  { id: 'Hype', label: '🔥 Hype' },
  { id: 'Feels', label: '🥺 Feels' }
];

export const CaptionGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [selectedTone, setSelectedTone] = useState(TONES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState<number | null>(null);

  const handleGenerate = async (isRetry = false) => {
    if (!description.trim() || isGenerating) return;
    
    setIsGenerating(true);
    if (!isRetry) {
      setCaptions([]);
      setSelectedCaptionIndex(null);
    }

    try {
      const prompt = `Generate exactly 3 different captions for a social media post in a Filipino friend group. Each caption should be on its own line, numbered 1. 2. 3.

Post description: ${description.trim()}
${imageUrl.trim() ? `Image URL for context: ${imageUrl.trim()}` : ''}
Tone requested: ${selectedTone.id}

Rules:
- Write in Taglish (mix of Filipino and English naturally)
- Each caption should be different in style and length
- Keep them under 100 characters each
- No hashtags
- Make them feel authentic, not generic
- At least one should have an emoji
- Match the ${selectedTone.id} tone requested
- Return ONLY the 3 captions, numbered. No explanation.`;

      const response = await callDeepSeek([
        { role: 'system', content: Botbot_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]);

      const lines = response.content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const parsedCaptions = lines.slice(0, 3).map(line => line.replace(/^[\d.)]+\s*/, '').trim());
      
      setCaptions(parsedCaptions);
    } catch (error) {
      console.error('Failed to generate captions:', error);
      toast.error('Failed to generate captions. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setSelectedCaptionIndex(index);
    toast.success('Copied! ✓');
  };

  const handleSend = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
    navigate('/feed', { state: { prefillCaption: text, openComposer: true } });
  };

  const charsLeft = 200 - description.length;

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-8">
      <div>
        <h2 className="font-heading font-bold text-xl flex items-center gap-2 text-main">
          ✨ Caption Generator
        </h2>
        <p className="text-faint text-sm mt-1">Para hindi ka na mag-isip ng caption</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border-subtle p-6">
        <label className="block text-sm font-medium text-main mb-2">Describe your post</label>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
            className="w-full bg-elevated rounded-xl border border-border-subtle px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary transition-colors text-main custom-scrollbar"
            rows={3}
            placeholder="e.g., late night jollibee run, grabe ang lipad, 3AM decisions..."
          />
          <div className="absolute bottom-3 right-3 text-xs text-faint flex items-center gap-2">
            <span className={charsLeft <= 20 ? 'text-danger font-medium' : ''}>{charsLeft}</span>
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className={`p-1 rounded-full transition-colors ${showImageInput ? 'bg-primary/20 text-primary' : 'hover:bg-base'}`}
              title="Add image URL for context"
            >
              <ImageIcon size={14} />
            </button>
          </div>
        </div>

        {showImageInput && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2">
            <label className="block text-xs text-muted mb-1.5">Add image URL for context (optional)</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-elevated border border-border-subtle">
              <ImageIcon size={14} className="text-muted shrink-0" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-transparent border-none text-sm focus:ring-0 py-0 text-main outline-none"
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs text-muted mb-2">Vibe</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(tone => (
              <button
                key={tone.id}
                onClick={() => setSelectedTone(tone)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  selectedTone.id === tone.id
                    ? 'bg-primary/15 border-primary text-primary'
                    : 'border-border text-muted bg-surface hover:text-main hover:border-border-subtle'
                }`}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleGenerate()}
          disabled={!description.trim() || isGenerating}
          className="w-full mt-5 bg-primary text-on-primary rounded-full py-2.5 font-medium flex items-center justify-center gap-2 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {isGenerating ? 'Generating...' : 'Generate Captions'}
        </button>
      </div>

      {isGenerating && captions.length === 0 && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-xl border border-border-subtle p-4 h-24 animate-pulse" />
          ))}
          <p className="text-faint text-sm text-center italic mt-2">Botbot is thinking... 🤔</p>
        </div>
      )}

      {captions.length > 0 && (
        <div className="flex flex-col gap-3">
          {captions.map((caption, idx) => (
            <div 
              key={idx}
              className={`bg-surface rounded-xl border p-4 cursor-pointer transition-all ${
                selectedCaptionIndex === idx ? 'border-primary bg-primary/5' : 'border-border-subtle hover:border-primary/50'
              }`}
              onClick={() => setSelectedCaptionIndex(idx)}
            >
              <p className="text-base text-main font-medium">{caption}</p>
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-subtle/50">
                <span className="text-xs font-medium text-muted bg-base px-2 py-1 rounded-md">
                  {selectedTone.label}
                </span>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(caption, idx); }}
                    className="p-1.5 rounded-md text-muted hover:text-main hover:bg-base transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSend(caption); }}
                    className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors"
                    title="Use in composer"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <button
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
            className="self-center mt-2 text-primary text-sm font-medium flex items-center gap-1.5 hover:underline disabled:opacity-50"
          >
            <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} /> Generate again
          </button>
        </div>
      )}
    </div>
  );
};
