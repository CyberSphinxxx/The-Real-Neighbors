import React, { useState, useEffect } from 'react';
import { X, Volume2, Type, Monitor } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface TypeRacerSettingsProps {
  onClose: () => void;
}

export const TypeRacerSettings: React.FC<TypeRacerSettingsProps> = ({ onClose }) => {
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('mono');
  const [theme, setTheme] = useState('default');
  const [caretStyle, setCaretStyle] = useState('blinking');
  const [caretColor, setCaretColor] = useState('#3b82f6');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [clickSound, setClickSound] = useState('soft');
  const [errorSound, setErrorSound] = useState(true);
  const [finishSound, setFinishSound] = useState(true);
  const [volume, setVolume] = useState(50);
  const [stopOnError, setStopOnError] = useState(false);
  const [showWpmLive, setShowWpmLive] = useState(true);
  const [blindMode, setBlindMode] = useState(false);

  const [stats, setStats] = useState({
    totalRaces: 0,
    bestWPM: 0,
    avgAccuracy: 0
  });

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('typeracer_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.fontSize) setFontSize(parsed.fontSize);
      if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
      if (parsed.theme) setTheme(parsed.theme);
      if (parsed.caretStyle) setCaretStyle(parsed.caretStyle);
      if (parsed.caretColor) setCaretColor(parsed.caretColor);
      if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
      if (parsed.clickSound) setClickSound(parsed.clickSound);
      if (parsed.errorSound !== undefined) setErrorSound(parsed.errorSound);
      if (parsed.finishSound !== undefined) setFinishSound(parsed.finishSound);
      if (parsed.volume !== undefined) setVolume(parsed.volume);
      if (parsed.stopOnError !== undefined) setStopOnError(parsed.stopOnError);
      if (parsed.showWpmLive !== undefined) setShowWpmLive(parsed.showWpmLive);
      if (parsed.blindMode !== undefined) setBlindMode(parsed.blindMode);
    }

    // Load stats
    const fetchStats = async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      const q = query(collection(db, 'gameScores/typeracer/scores'), where('uid', '==', user.id));
      const snap = await getDocs(q);
      let best = 0;
      let totalAcc = 0;
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.score > best) best = data.score;
        totalAcc += data.metadata?.accuracy || 0;
      });
      setStats({
        totalRaces: snap.size,
        bestWPM: best,
        avgAccuracy: snap.size > 0 ? Math.round(totalAcc / snap.size) : 0
      });
    };
    fetchStats();
  }, []);

  // Save to local storage
  useEffect(() => {
    const settings = {
      fontSize, fontFamily, theme, caretStyle, caretColor,
      soundEnabled, clickSound, errorSound, finishSound,
      volume, stopOnError, showWpmLive, blindMode
    };
    localStorage.setItem('typeracer_settings', JSON.stringify(settings));
  }, [
    fontSize, fontFamily, theme, caretStyle, caretColor,
    soundEnabled, clickSound, errorSound, finishSound,
    volume, stopOnError, showWpmLive, blindMode
  ]);

  return (
    <div className="absolute inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface h-full shadow-2xl flex flex-col border-l border-border-subtle animate-in slide-in-from-right-full duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-main">TypeRacer Settings</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-main rounded-full hover:bg-elevated transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          <div className="text-xs text-muted italic mb-4">
            Changes applied mid-race take effect on the next race.
          </div>

          {/* Display */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary flex items-center gap-2">
              <Type size={16} /> Display
            </h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-main flex justify-between">
                <span>Font Size</span>
                <span className="text-muted">{fontSize}px</span>
              </label>
              <input 
                type="range" min="14" max="24" step="2" 
                value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-elevated rounded-lg appearance-none cursor-pointer"
              />
              <div 
                className="mt-2 p-3 bg-elevated rounded-lg border border-border-subtle text-main"
                style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily === 'mono' ? 'monospace' : fontFamily === 'code' ? '"Courier New", monospace' : '"VT323", monospace' }}
              >
                The quick brown fox
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-main">Font Family</label>
              <div className="flex gap-2">
                {['mono', 'code', 'retro'].map(f => (
                  <button 
                    key={f} onClick={() => setFontFamily(f)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${fontFamily === f ? 'bg-primary/10 text-primary border-primary' : 'bg-elevated text-muted border-border-subtle hover:text-main'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-main">Theme</label>
              <div className="flex gap-2">
                {['default', 'dark', 'light'].map(t => (
                  <button 
                    key={t} onClick={() => setTheme(t)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${theme === t ? 'bg-primary/10 text-primary border-primary' : 'bg-elevated text-muted border-border-subtle hover:text-main'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Caret */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Caret</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-main">Style</label>
              <div className="flex gap-2">
                {['blinking', 'smooth', 'static', 'off'].map(s => (
                  <button 
                    key={s} onClick={() => setCaretStyle(s)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${caretStyle === s ? 'bg-primary/10 text-primary border-primary' : 'bg-elevated text-muted border-border-subtle hover:text-main'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-main">Color</label>
              <input 
                type="color" 
                value={caretColor} 
                onChange={e => setCaretColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
            </div>
          </section>

          {/* Sound */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary flex items-center gap-2">
              <Volume2 size={16} /> Sound Effects
            </h3>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-main">Enable Sounds</label>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-primary' : 'bg-elevated border border-border-subtle'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${soundEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {soundEnabled && (
              <div className="pl-4 space-y-4 border-l-2 border-border-subtle ml-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-main">Click Sound</label>
                  <div className="flex gap-2">
                    {['none', 'soft', 'mechanical'].map(s => (
                      <button 
                        key={s} onClick={() => setClickSound(s)}
                        className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${clickSound === s ? 'bg-primary/10 text-primary border-primary' : 'bg-elevated text-muted border-border-subtle hover:text-main'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-main">Error Sound</label>
                  <input type="checkbox" checked={errorSound} onChange={e => setErrorSound(e.target.checked)} className="accent-primary w-4 h-4" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-main flex justify-between">
                    <span>Volume</span>
                    <span className="text-muted">{volume}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="100" 
                    value={volume} onChange={e => setVolume(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-elevated rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Behavior */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary flex items-center gap-2">
              <Monitor size={16} /> Behavior
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-main">Stop on error</label>
                <span className="text-xs text-muted">Block typing until error is fixed</span>
              </div>
              <button 
                onClick={() => setStopOnError(!stopOnError)}
                className={`w-11 h-6 rounded-full transition-colors relative ${stopOnError ? 'bg-primary' : 'bg-elevated border border-border-subtle'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${stopOnError ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-main">Live WPM</label>
                <span className="text-xs text-muted">Show speed while typing</span>
              </div>
              <button 
                onClick={() => setShowWpmLive(!showWpmLive)}
                className={`w-11 h-6 rounded-full transition-colors relative ${showWpmLive ? 'bg-primary' : 'bg-elevated border border-border-subtle'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showWpmLive ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-main text-danger">Blind mode</label>
                <span className="text-xs text-muted">Hide typed characters (expert)</span>
              </div>
              <button 
                onClick={() => setBlindMode(!blindMode)}
                className={`w-11 h-6 rounded-full transition-colors relative ${blindMode ? 'bg-danger' : 'bg-elevated border border-border-subtle'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${blindMode ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </section>

          {/* Stats */}
          <section className="space-y-4 pt-4 border-t border-border-subtle">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Your All-Time Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-elevated p-3 rounded-xl border border-border-subtle">
                <div className="text-2xl font-bold text-main">{stats.bestWPM}</div>
                <div className="text-xs text-muted">Best WPM</div>
              </div>
              <div className="bg-elevated p-3 rounded-xl border border-border-subtle">
                <div className="text-2xl font-bold text-main">{stats.avgAccuracy}%</div>
                <div className="text-xs text-muted">Avg Accuracy</div>
              </div>
              <div className="bg-elevated p-3 rounded-xl border border-border-subtle col-span-2">
                <div className="text-2xl font-bold text-main">{stats.totalRaces}</div>
                <div className="text-xs text-muted">Races Completed</div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
