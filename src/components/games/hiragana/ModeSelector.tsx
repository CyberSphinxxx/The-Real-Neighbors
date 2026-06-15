import React, { useState } from 'react';
import { Settings, Info, X } from 'lucide-react';
import { type HiraganaMode, type HiraganaSettings } from '../../../hooks/useHiragana';

export const HIRAGANA_MODES: HiraganaMode[] = [
  {
    id: 'endless',
    name: 'Endless Survival',
    description: 'Dynamic speed, 3 hearts. Survive as long as you can!',
    icon: '🔥',
    cardCount: 'endless',
    hasTimer: true,
    timerSeconds: 12,
    isMultipleChoice: true,
    isTyping: false,
    submitsToLeaderboard: true,
    maxScore: null
  },
  {
    id: 'all',
    name: 'All Hiragana',
    description: 'Go through every character once',
    icon: '📚',
    cardCount: 'all',
    hasTimer: false,
    timerSeconds: null,
    isMultipleChoice: true,
    isTyping: false,
    submitsToLeaderboard: true,
    maxScore: null
  },
  {
    id: 'speed',
    name: 'Speed Round',
    description: '10 random cards, faster = more points',
    icon: '⚡',
    cardCount: 10,
    hasTimer: true,
    timerSeconds: 10,
    isMultipleChoice: true,
    isTyping: false,
    submitsToLeaderboard: true,
    maxScore: 1000
  },
  {
    id: 'type',
    name: 'Type It',
    description: 'Type the romaji — no hints!',
    icon: '⌨️',
    cardCount: 10,
    hasTimer: true,
    timerSeconds: 15,
    isMultipleChoice: false,
    isTyping: true,
    submitsToLeaderboard: true,
    maxScore: 1500
  },
  {
    id: 'words',
    name: 'Words & Sentences',
    description: 'Build words & phrases. Progression mode!',
    icon: '🧩',
    cardCount: 'all',
    hasTimer: false,
    timerSeconds: null,
    isMultipleChoice: false,
    isTyping: false,
    submitsToLeaderboard: false,
    maxScore: null
  },
  {
    id: 'study',
    name: 'Study Mode',
    description: 'Learn at your own pace',
    icon: '🧘',
    cardCount: 'all',
    hasTimer: false,
    timerSeconds: null,
    isMultipleChoice: false,
    isTyping: false,
    submitsToLeaderboard: false,
    maxScore: null
  },
  {
    id: 'dictionary',
    name: 'Dictionary',
    description: 'Browse all characters and their romaji',
    icon: '📖',
    cardCount: 'all',
    hasTimer: false,
    timerSeconds: null,
    isMultipleChoice: false,
    isTyping: false,
    submitsToLeaderboard: false,
    maxScore: null
  }
];

interface ModeSelectorProps {
  onSelect: (mode: HiraganaMode) => void;
  settings: HiraganaSettings;
  onUpdateSettings: (settings: Partial<HiraganaSettings>) => void;
  onOpenSettings: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  onSelect,
  settings,
  onUpdateSettings,
  onOpenSettings
}) => {
  const [selectedMode, setSelectedMode] = useState<HiraganaMode | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Calculate current character count
  let charCount = 46; // basic
  if (settings.includeDakuten) charCount += 25;
  if (settings.includeCombinations) charCount += 33;

  return (
    <div className="max-w-5xl w-full mx-auto px-4 py-6 flex flex-col h-full relative">
      <button 
        className="absolute top-4 right-4 md:top-6 md:right-0 w-10 h-10 bg-surface border border-border-subtle rounded-full flex items-center justify-center hover:bg-surface-hover hover:border-primary text-muted hover:text-main transition-colors"
        onClick={onOpenSettings}
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      <div className="text-center mb-6 pt-4">
        <div className="text-4xl mb-2 select-none">🎌</div>
        <h2 className="font-heading font-bold text-2xl text-main">Hiragana Quiz</h2>
        <p className="text-muted text-sm mt-1">Choose your challenge</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1">
        {/* Left Column: Mode Grid */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HIRAGANA_MODES.map((mode) => {
              const isSelected = selectedMode?.id === mode.id;
              const isStudy = mode.id === 'study';

              return (
                <div
                  key={mode.id}
                  onClick={() => {
                    setSelectedMode(mode);
                    if (mode.id === 'endless') {
                      onUpdateSettings({ includeDakuten: true, includeCombinations: true });
                    }
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-md transform -translate-y-[2px]' 
                      : isStudy 
                        ? 'border-dashed border-border bg-surface hover:border-primary hover:shadow-md hover:-translate-y-[2px]' 
                        : 'border-border bg-surface hover:border-primary hover:shadow-md hover:-translate-y-[2px]'
                  }`}
                >
                  <div className="text-3xl mb-2">{mode.icon}</div>
                  <h3 className="font-heading font-semibold text-base text-main">{mode.name}</h3>
                  <p className="text-muted text-sm mt-1 flex-1">{mode.description}</p>
                  
                  {isStudy && (
                    <div className="mt-2 text-[10px] text-faint font-medium uppercase tracking-wide">
                      🧘 No leaderboard
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border-subtle flex justify-between items-center text-xs text-faint font-medium">
                    <span>
                      {mode.cardCount === 'all' 
                        ? (isStudy ? 'All cards' : `${charCount} cards`) 
                        : `${mode.cardCount} cards`}
                    </span>
                    <span>
                      {mode.hasTimer ? `${mode.timerSeconds}s per card` : 'No timer'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Settings & Play Button */}
        <div className="w-full lg:w-[340px] flex flex-col gap-6 lg:sticky lg:top-6">
          {/* Quick Settings */}
          <div className="bg-surface rounded-2xl border border-border-subtle p-5">
        <h3 className="text-xs text-faint uppercase tracking-wider font-semibold mb-3">
          Character Set
        </h3>
        
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center py-2 border-b border-border-subtle">
            <div>
              <span className="font-medium text-main text-sm block flex items-center gap-2">
                Basic Hiragana <span className="bg-elevated px-1.5 py-0.5 rounded text-[10px] text-muted">46</span>
                <span className="text-[10px] text-faint">🔒 Always on</span>
              </span>
            </div>
            <input type="checkbox" checked disabled className="w-4 h-4 accent-primary opacity-50" />
          </div>

          <label className={`flex justify-between items-center py-2 border-b border-border-subtle -mx-2 px-2 rounded-lg transition-colors ${selectedMode?.id === 'endless' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-hover'}`}>
            <div>
              <span className="font-medium text-main text-sm block flex items-center gap-2">
                Include Dakuten <span className="bg-elevated px-1.5 py-0.5 rounded text-[10px] text-muted">+25</span>
                {selectedMode?.id === 'endless' && <span className="text-[10px] text-faint text-primary">Required for Endless</span>}
              </span>
              <span className="text-faint text-xs mt-0.5 block">が ぎ ぐ ば び ぶ ぱ ぴ ぷ...</span>
            </div>
            <input 
              type="checkbox" 
              className={`w-4 h-4 accent-primary ${selectedMode?.id === 'endless' ? 'opacity-50 cursor-not-allowed' : ''}`}
              checked={settings.includeDakuten}
              disabled={selectedMode?.id === 'endless'}
              onChange={(e) => onUpdateSettings({ includeDakuten: e.target.checked })}
            />
          </label>

          <label className={`flex justify-between items-center py-2 -mx-2 px-2 rounded-lg transition-colors ${selectedMode?.id === 'endless' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-hover'}`}>
            <div>
              <span className="font-medium text-main text-sm block flex items-center gap-2">
                Include Combinations <span className="bg-elevated px-1.5 py-0.5 rounded text-[10px] text-muted">+33</span>
                {selectedMode?.id === 'endless' && <span className="text-[10px] text-faint text-primary">Required for Endless</span>}
              </span>
              <span className="text-faint text-xs mt-0.5 block">きゃ しゅ ちょ にゃ...</span>
            </div>
            <input 
              type="checkbox" 
              className={`w-4 h-4 accent-primary ${selectedMode?.id === 'endless' ? 'opacity-50 cursor-not-allowed' : ''}`}
              checked={settings.includeCombinations}
              disabled={selectedMode?.id === 'endless'}
              onChange={(e) => onUpdateSettings({ includeCombinations: e.target.checked })}
            />
          </label>
        </div>

        <div className="mt-4 pt-3 border-t border-border-subtle text-center">
          <p className="text-primary text-sm font-medium">
            Total: {charCount} characters in this session
          </p>
        </div>
      </div>

          <div className="mt-auto lg:mt-0 flex gap-2">
            <button
              className="flex-1 bg-primary hover:bg-primary-hover text-on-primary rounded-full py-3.5 font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 flex items-center justify-center gap-2"
              disabled={!selectedMode}
              onClick={() => selectedMode && onSelect(selectedMode)}
            >
              {selectedMode ? (
                selectedMode.id === 'study' ? `Start Studying 🧘` : `Start ${selectedMode.name} ${selectedMode.icon}`
              ) : (
                'Select a mode'
              )}
            </button>
            <button
              className="w-[52px] shrink-0 bg-surface border border-border-subtle hover:border-primary hover:bg-primary/10 text-muted hover:text-primary rounded-full flex items-center justify-center transition-all"
              onClick={() => setShowHowToPlay(true)}
              aria-label="How to play"
              title="How to play"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base/80 backdrop-blur-sm" onClick={() => setShowHowToPlay(false)} />
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-xl relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-elevated sticky top-0 z-20">
              <h3 className="font-heading font-bold text-lg flex items-center gap-2 text-main">
                <Info className="w-5 h-5 text-primary" />
                How to Play
              </h3>
              <button 
                onClick={() => setShowHowToPlay(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover text-muted hover:text-main transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-main flex items-center gap-2 mb-2 text-primary">
                    🔥 Endless Survival
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-muted space-y-2">
                    <li>Survive as long as possible! You start with 3 hearts.</li>
                    <li>The timer drops by 5% after <strong>every correct answer</strong>.</li>
                    <li>It gets blisteringly fast—eventually reaching 2.0 seconds per character!</li>
                    <li>As you progress, the number of choices will increase from 4 to 6, and eventually up to 8!</li>
                    <li>Reaching Level 11+ forces Dakuten and Combinations on.</li>
                  </ul>
                </div>
                
                <div className="h-px w-full bg-border-subtle"></div>
                
                <div>
                  <h4 className="font-bold text-main flex items-center gap-2 mb-2">
                    📚 All Hiragana
                  </h4>
                  <p className="text-sm text-muted">
                    Go through all available characters exactly once without a timer. Great for practice and seeing how many you know overall.
                  </p>
                </div>
                
                <div className="h-px w-full bg-border-subtle"></div>
                
                <div>
                  <h4 className="font-bold text-main flex items-center gap-2 mb-2">
                    ⚡ Speed Round
                  </h4>
                  <p className="text-sm text-muted">
                    10 random cards. You have a fixed time limit per card. The faster you answer, the more points you get. Test your reflexes!
                  </p>
                </div>
                
                <div className="h-px w-full bg-border-subtle"></div>
                
                <div>
                  <h4 className="font-bold text-main flex items-center gap-2 mb-2">
                    ⌨️ Type It
                  </h4>
                  <p className="text-sm text-muted">
                    No multiple choice. You must type the correct romaji spelling using your keyboard. Hardcore practice.
                  </p>
                </div>
                <div className="h-px w-full bg-border-subtle"></div>
                
                <div>
                  <h4 className="font-bold text-main flex items-center gap-2 mb-2">
                    🧩 Words & Sentences
                  </h4>
                  <p className="text-sm text-muted">
                    Progress through Basic, Medium, and Hard tiers by assembling Hiragana words from fragments. Build your vocabulary and unlock the Hardcore Typing final boss!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
