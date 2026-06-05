import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CalendarPlus, Loader2, ListTodo } from 'lucide-react';
import { callDeepSeek } from '../../lib/deepseek';
import { Botbot_SYSTEM_PROMPT } from '../../lib/botbotPersonality';
import toast from 'react-hot-toast';

interface GeneratedEvent {
  botMessage: string;
  title: string;
  type: string;
  description: string;
  pollSuggestions: {
    question: string;
    options: string[];
  }[];
}

export const EventPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [vibe, setVibe] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedEvent | null>(null);

  const handleGenerate = async () => {
    if (!vibe.trim()) return;
    setIsGenerating(true);
    setResult(null);

    try {
      const userPrompt = `A user wants to plan an event for their friend group.
Vibe/Idea: "${vibe.trim()}"

Help them plan it! Return ONLY a JSON object matching this exact schema:
{
  "botMessage": "A hype Taglish message from Botbot encouraging the event (max 2 sentences)",
  "title": "A catchy event title",
  "type": "hangout" | "gaming" | "trip" | "online" | "custom",
  "description": "A fun event description, including a bulleted list of what people should bring or prepare (Taglish)",
  "pollSuggestions": [
    {
      "question": "A poll question to decide details (e.g. When?, Where?, What food?)",
      "options": ["Option 1", "Option 2", "Option 3"]
    }
  ]
}

Make it sound fun and casual! Provide exactly 2 poll suggestions.`;

      const response = await callDeepSeek(
        [
          { role: 'system', content: Botbot_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.85, maxTokens: 1000 }
      );

      let content = response.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(content);
      setResult(parsed);
    } catch (error) {
      console.error(error);
      toast.error('Failed to plan event. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateEvent = () => {
    if (!result) return;
    navigate('/events', { 
      state: { 
        prefillEvent: { 
          title: result.title, 
          type: result.type, 
          description: result.description 
        } 
      } 
    });
  };

  const handleCreatePoll = (poll: { question: string, options: string[] }) => {
    navigate('/feed', { state: { openPoll: true, pollData: poll } });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-8">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-main flex items-center gap-2">
          📅 Event Planner
        </h1>
        <p className="text-muted text-sm mt-1">Bawal drawing! Planuhin na natin yan.</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-6 shadow-sm">
        <label className="block text-sm font-medium text-main mb-2">Ano bang trip niyong gawin?</label>
        <textarea
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="e.g. Gusto ko mag beach or mag roadtrip bigla this weekend..."
          className="w-full bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-24 mb-4"
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !vibe.trim()}
          className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {isGenerating ? 'Drafting the master plan...' : 'Plan this event'}
        </button>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
          <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-on-primary">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="font-bold text-main text-sm">Botbot 🤖</span>
              <p className="text-main mt-1 text-sm whitespace-pre-wrap">{result.botMessage}</p>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border-subtle p-5">
            <h3 className="font-bold text-lg text-main mb-1">{result.title}</h3>
            <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider mb-4">
              {result.type}
            </span>
            <p className="text-main text-sm whitespace-pre-wrap mb-6">{result.description}</p>
            
            <button
              onClick={handleCreateEvent}
              className="w-full py-2.5 rounded-xl bg-base border-2 border-primary text-primary font-bold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
            >
              <CalendarPlus size={16} /> Create This Event
            </button>
          </div>

          {result.pollSuggestions && result.pollSuggestions.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border-subtle p-5">
              <h4 className="font-semibold text-main mb-3 flex items-center gap-2">
                <ListTodo size={16} className="text-primary" /> Unsure pa sa details?
              </h4>
              <div className="space-y-3">
                {result.pollSuggestions.map((poll, i) => (
                  <div key={i} className="bg-base border border-border-subtle rounded-xl p-3 flex justify-between items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-main">{poll.question}</p>
                      <p className="text-xs text-muted mt-1">{poll.options.join(' • ')}</p>
                    </div>
                    <button
                      onClick={() => handleCreatePoll(poll)}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors whitespace-nowrap"
                    >
                      Ask Group
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
