import React, { useState } from 'react';
import { Type, Quote, Clock, Wind, Play } from 'lucide-react';
import type { TypeRacerConfig, GhostData } from '../../../hooks/useTypeRacer';
import { getWordsText, getQuote, getTimedTarget } from '../../../lib/typeracerWords';
import { GhostSelector } from './GhostSelector';

interface ModeSelectorProps {
  onStart: (config: TypeRacerConfig) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onStart }) => {
  const [mode, setMode] = useState<'words' | 'quote' | 'timed' | 'zen'>('words');
  const [wordPack, setWordPack] = useState('mixed');
  const [quotePack, setQuotePack] = useState('anime');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [timedDuration, setTimedDuration] = useState(30);
  const [selectedGhost, setSelectedGhost] = useState<GhostData | null>(null);

  const handleStart = () => {
    let text = '';
    if (mode === 'words') text = getWordsText(wordPack, length);
    else if (mode === 'quote') text = getQuote(quotePack).text;
    else if (mode === 'timed') text = getTimedTarget();
    else if (mode === 'zen') text = getWordsText('mixed', 'medium'); // Arbitrary starting text for zen

    onStart({
      mode,
      text,
      wordPack: mode === 'words' ? wordPack : undefined,
      quotePack: mode === 'quote' ? quotePack : undefined,
      length: mode === 'words' ? length : undefined,
      timedDuration: mode === 'timed' ? timedDuration : undefined,
      ghost: selectedGhost
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-main mb-2">TypeRacer</h1>
        <p className="text-muted">Type fast. Beat your friends. Flex your WPM.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { id: 'words', icon: <Type size={20} />, label: 'Words' },
          { id: 'quote', icon: <Quote size={20} />, label: 'Quote' },
          { id: 'timed', icon: <Clock size={20} />, label: 'Timed' },
          { id: 'zen', icon: <Wind size={20} />, label: 'Zen' }
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id as any)}
            className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
              mode === m.id 
                ? 'bg-primary/10 border-primary text-primary scale-105 shadow-sm' 
                : 'bg-surface border-border-subtle text-muted hover:text-main hover:bg-elevated'
            }`}
          >
            {m.icon}
            <span className="font-semibold">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-8 animate-in fade-in duration-300">
        <h3 className="text-lg font-bold text-main mb-4 capitalize">{mode} Settings</h3>
        
        {mode === 'words' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted block mb-2">Word Pack</label>
              <div className="flex flex-wrap gap-2">
                {['english', 'filipino', 'gaming', 'mixed'].map(p => (
                  <button
                    key={p} onClick={() => setWordPack(p)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors capitalize ${
                      wordPack === p ? 'bg-primary text-white border-primary' : 'bg-elevated text-main border-border-subtle hover:border-primary/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted block mb-2">Length</label>
              <div className="flex flex-wrap gap-2">
                {['short', 'medium', 'long'].map(l => (
                  <button
                    key={l} onClick={() => setLength(l as any)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors capitalize ${
                      length === l ? 'bg-primary text-white border-primary' : 'bg-elevated text-main border-border-subtle hover:border-primary/50'
                    }`}
                  >
                    {l} ({l === 'short' ? 15 : l === 'medium' ? 30 : 50} words)
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'quote' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted block mb-2">Quote Pack</label>
              <div className="flex flex-wrap gap-2">
                {['anime', 'gaming', 'motivational', 'filipino'].map(p => (
                  <button
                    key={p} onClick={() => setQuotePack(p)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors capitalize ${
                      quotePack === p ? 'bg-primary text-white border-primary' : 'bg-elevated text-main border-border-subtle hover:border-primary/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'timed' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted block mb-2">Duration</label>
              <div className="flex flex-wrap gap-2">
                {[30, 60].map(t => (
                  <button
                    key={t} onClick={() => setTimedDuration(t)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      timedDuration === t ? 'bg-primary text-white border-primary' : 'bg-elevated text-main border-border-subtle hover:border-primary/50'
                    }`}
                  >
                    {t} Seconds
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'zen' && (
          <div className="text-muted text-sm">
            Just type. No timers, no errors, no pressure. Endless random words will be generated as you type. Scores are not saved to the leaderboard.
          </div>
        )}
      </div>

      <GhostSelector 
        mode={mode} 
        pack={mode === 'words' ? wordPack : mode === 'quote' ? quotePack : 'mixed'} 
        length={mode === 'words' ? length : mode === 'timed' ? timedDuration.toString() : 'medium'}
        onSelect={setSelectedGhost}
        selectedGhost={selectedGhost}
      />

      <div className="flex justify-center">
        <button
          onClick={handleStart}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <Play fill="currentColor" size={20} />
          Start Race
        </button>
      </div>
    </div>
  );
};
