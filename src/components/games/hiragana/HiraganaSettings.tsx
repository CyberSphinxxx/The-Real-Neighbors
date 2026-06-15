import React, { useState, useEffect } from 'react';
import { X, Volume2, Type, Eye, ArrowRight, Trash2 } from 'lucide-react';
import { type HiraganaSettings } from '../../../hooks/useHiragana';

interface HiraganaSettingsPanelProps {
  settings: HiraganaSettings;
  onSave: (settings: HiraganaSettings) => void;
  onClose: () => void;
}

export const HiraganaSettingsPanel: React.FC<HiraganaSettingsPanelProps> = ({
  settings,
  onSave,
  onClose
}) => {
  const [localSettings, setLocalSettings] = useState<HiraganaSettings>(settings);
  const [studyStats, setStudyStats] = useState({ known: 0, learning: 0, total: 0 });
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hiragana_study');
      if (saved) {
        const { known = [], learning = [] } = JSON.parse(saved);
        setStudyStats({
          known: known.length,
          learning: learning.length,
          total: known.length + learning.length
        });
      }
    } catch (e) {
      console.error('Failed to load study stats', e);
    }
  }, []);

  const handleChange = (key: keyof HiraganaSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAndClose = () => {
    onSave(localSettings);
    onClose();
  };

  const handleResetStudy = () => {
    localStorage.removeItem('hiragana_study');
    setStudyStats({ known: 0, learning: 0, total: 0 });
    setShowConfirmReset(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex justify-end animate-in fade-in">
      <div className="w-full max-w-md bg-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-border-subtle">
          <h2 className="font-heading font-bold text-xl text-main">Settings</h2>
          <button 
            className="w-8 h-8 flex items-center justify-center bg-elevated rounded-full hover:bg-surface-hover text-muted hover:text-main transition-colors"
            onClick={handleSaveAndClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 flex flex-col gap-8">
          
          {/* Character Set */}
          <section>
            <h3 className="text-xs font-semibold text-faint uppercase tracking-wider mb-4">Character Set</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-elevated border border-border-subtle">
                <div>
                  <span className="font-medium text-main text-sm block">Include Dakuten</span>
                  <span className="text-muted text-xs">が ぎ ぐ ば び ぶ (+25)</span>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-primary"
                  checked={localSettings.includeDakuten}
                  onChange={(e) => handleChange('includeDakuten', e.target.checked)}
                />
              </label>
              
              <label className="flex items-center justify-between p-3 rounded-xl bg-elevated border border-border-subtle">
                <div>
                  <span className="font-medium text-main text-sm block">Include Combinations</span>
                  <span className="text-muted text-xs">きゃ しゅ ちょ にゃ (+33)</span>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-primary"
                  checked={localSettings.includeCombinations}
                  onChange={(e) => handleChange('includeCombinations', e.target.checked)}
                />
              </label>
            </div>
          </section>

          {/* Display */}
          <section>
            <h3 className="text-xs font-semibold text-faint uppercase tracking-wider mb-4">Display</h3>
            <div className="flex flex-col gap-4">
              
              {/* Font Style */}
              <div>
                <label className="flex items-center gap-2 mb-2 text-sm font-medium text-main">
                  <Type className="w-4 h-4 text-muted" /> Font Style
                </label>
                <div className="flex gap-2 p-1 bg-elevated rounded-xl">
                  <button
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${localSettings.fontStyle === 'sans' ? 'bg-surface shadow-sm text-main' : 'text-muted hover:text-main'}`}
                    onClick={() => handleChange('fontStyle', 'sans')}
                  >
                    <span className="font-sans text-lg font-bold">あ</span> Sans
                  </button>
                  <button
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${localSettings.fontStyle === 'serif' ? 'bg-surface shadow-sm text-main' : 'text-muted hover:text-main'}`}
                    onClick={() => handleChange('fontStyle', 'serif')}
                  >
                    <span className="font-serif text-lg font-bold">あ</span> Serif
                  </button>
                </div>
              </div>

              {/* Show Hints */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-elevated border border-border-subtle cursor-pointer">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-main text-sm block">Show Group Hints</span>
                    <span className="text-muted text-xs">Makes it easier (e.g. SA-row)</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-primary"
                  checked={localSettings.showHints}
                  onChange={(e) => handleChange('showHints', e.target.checked)}
                />
              </label>

              {/* Auto Advance */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-elevated border border-border-subtle cursor-pointer">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-main text-sm block">Auto-Advance</span>
                    <span className="text-muted text-xs">Move to next card immediately</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-primary"
                  checked={localSettings.autoAdvance}
                  onChange={(e) => handleChange('autoAdvance', e.target.checked)}
                />
              </label>

            </div>
          </section>

          {/* Sound */}
          <section>
            <h3 className="text-xs font-semibold text-faint uppercase tracking-wider mb-4">Audio</h3>
            <div className="p-4 rounded-xl bg-elevated border border-border-subtle flex flex-col gap-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-sm font-medium text-main">
                  <Volume2 className="w-4 h-4 text-muted" /> Sound Effects
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-primary"
                  checked={localSettings.soundEnabled}
                  onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                />
              </label>
              
              {localSettings.soundEnabled && (
                <div className="flex items-center gap-3 animate-in fade-in">
                  <span className="text-xs text-muted">Vol</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={localSettings.volume}
                    onChange={(e) => handleChange('volume', parseInt(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-xs text-muted w-6 text-right">{localSettings.volume}</span>
                </div>
              )}
            </div>
          </section>

          {/* Study Progress */}
          <section>
            <h3 className="text-xs font-semibold text-faint uppercase tracking-wider mb-4">Study Progress</h3>
            <div className="p-4 rounded-xl bg-elevated border border-border-subtle">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-main font-medium">Characters you know:</span>
                <span className="text-sm font-semibold text-green-500">{studyStats.known}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-main font-medium">Still learning:</span>
                <span className="text-sm font-semibold text-amber-500">{studyStats.learning}</span>
              </div>
              
              {showConfirmReset ? (
                <div className="flex gap-2 animate-in fade-in">
                  <button 
                    className="flex-1 py-2 bg-surface border border-border-subtle rounded-lg text-sm font-medium hover:bg-surface-hover"
                    onClick={() => setShowConfirmReset(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="flex-1 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-red-600 shadow-sm shadow-danger/20"
                    onClick={handleResetStudy}
                  >
                    Confirm Reset
                  </button>
                </div>
              ) : (
                <button 
                  className="w-full py-2.5 border-2 border-danger/20 text-danger hover:bg-danger/10 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  onClick={() => setShowConfirmReset(true)}
                  disabled={studyStats.total === 0}
                >
                  <Trash2 className="w-4 h-4" /> Reset Progress
                </button>
              )}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface">
          <button 
            className="w-full bg-primary hover:bg-primary-hover text-on-primary font-semibold py-3 rounded-full transition-colors"
            onClick={handleSaveAndClose}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
