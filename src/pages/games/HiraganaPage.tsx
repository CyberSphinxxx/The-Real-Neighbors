import { useState, useMemo, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { ShareToFeedModal } from '../../components/games/ShareToFeedModal';
import { HiraganaShell } from '../../components/games/hiragana/HiraganaShell';
import { ModeSelector } from '../../components/games/hiragana/ModeSelector';
import { Flashcard } from '../../components/games/hiragana/Flashcard';
import { ChoiceButtons } from '../../components/games/hiragana/ChoiceButtons';
import { TypeInput } from '../../components/games/hiragana/TypeInput';
import { TimerRing } from '../../components/games/hiragana/TimerRing';
import { ProgressHeader } from '../../components/games/hiragana/ProgressHeader';
import { ResultScreen } from '../../components/games/hiragana/ResultScreen';
import { StudyMode as StudyModeUI } from '../../components/games/hiragana/StudyMode';
import { DictionaryMode } from '../../components/games/hiragana/DictionaryMode';
import { HiraganaSettingsPanel } from '../../components/games/hiragana/HiraganaSettings';
import { LiveLeaderboard } from '../../components/games/hiragana/LiveLeaderboard';
import { WordsModeLanding } from '../../components/games/hiragana/WordsModeLanding';
import { WordBuilder } from '../../components/games/hiragana/WordBuilder';
import { HardcoreTyping } from '../../components/games/hiragana/HardcoreTyping';
import { type VocabTier } from '../../lib/vocabularyData';
import { getCharacterSet, type HiraganaChar } from '../../lib/hiraganaData';
import { useHiragana, type HiraganaMode, type HiraganaSettings } from '../../hooks/useHiragana';
import { getWeeklyLeaderboard, type ScoreEntry } from '../../lib/gameUtils';

const DEFAULT_SETTINGS: HiraganaSettings = {
  includeDakuten: false,
  includeCombinations: false,
  showHints: false,
  autoAdvance: true,
  fontStyle: 'sans',
  soundEnabled: true,
  volume: 60
};

interface ShareData {
  text: string;
  gameId: string;
  scoreDisplay: string;
  modeName: string;
}

export default function HiraganaPage() {
  const [phase, setPhase] = useState<'menu' | 'playing' | 'studying' | 'dictionary' | 'words_landing' | 'word_builder' | 'hardcore_typing'>('menu');
  const [selectedWordTier, setSelectedWordTier] = useState<VocabTier | 'typing' | null>(null);
  const [selectedMode, setSelectedMode] = useState<HiraganaMode | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const [settings, setSettings] = useState<HiraganaSettings>(() => {
    try {
      const saved = localStorage.getItem('hiragana_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);
  
  // Custom characters for study mode when coming from "Study These" in results
  const [studyChars, setStudyChars] = useState<HiraganaChar[] | null>(null);

  const saveSettings = (newSettings: HiraganaSettings) => {
    setSettings(newSettings);
    localStorage.setItem('hiragana_settings', JSON.stringify(newSettings));
  };

  const updateSettingsPartial = (partial: Partial<HiraganaSettings>) => {
    saveSettings({ ...settings, ...partial });
  };

  const characterSet = useMemo(() => 
    getCharacterSet(settings.includeDakuten, settings.includeCombinations), 
    [settings.includeDakuten, settings.includeCombinations]
  );
  
  const fallbackMode = useMemo(() => ({ id: 'all' } as HiraganaMode), []);

  const gameState = useHiragana({
    mode: selectedMode || fallbackMode,
    characterSet: studyChars || characterSet,
    settings,
    sessionKey: playCount,
  });

  useEffect(() => {
    if (phase === 'playing' && selectedMode?.id === 'endless') {
      getWeeklyLeaderboard('hiragana', 'endless')
        .then(scores => setLeaderboardScores(scores))
        .catch(err => console.error('Failed to fetch endless leaderboard', err));
    }
  }, [phase, selectedMode]);

  const handleStartMode = (mode: HiraganaMode) => {
    setSelectedMode(mode);
    setStudyChars(null);
    setPlayCount(prev => prev + 1);
    if (mode.id === 'study') {
      setPhase('studying');
    } else if (mode.id === 'dictionary') {
      setPhase('dictionary');
    } else if (mode.id === 'words') {
      setPhase('words_landing');
    } else {
      setPhase('playing');
    }
  };

  const handleStudySpecific = (chars: HiraganaChar[]) => {
    setStudyChars(chars);
    setPhase('studying');
  };

  const handleQuit = () => {
    setPhase('menu');
    setSelectedMode(null);
    setStudyChars(null);
    setSelectedWordTier(null);
  };

  const handleSelectTier = (tier: VocabTier | 'typing') => {
    setSelectedWordTier(tier);
    if (tier === 'typing') {
      setPhase('hardcore_typing');
    } else {
      setPhase('word_builder');
    }
  };

  const handlePlayAgain = () => {
    setPlayCount(prev => prev + 1);
    setPhase('playing');
  };

  return (
    <HiraganaShell 
      phase={gameState.phase === 'finished' ? 'finished' : phase} 
      subMode={selectedMode?.id}
      onQuit={handleQuit}
    >
      {phase === 'menu' && (
        <ModeSelector 
          onSelect={handleStartMode}
          settings={settings}
          onUpdateSettings={updateSettingsPartial}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {phase === 'playing' && selectedMode && (
        <>
          {/* Overlay for countdown */}
          {gameState.phase === 'countdown' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-base/80 backdrop-blur-sm">
              <div className="text-8xl font-heading font-bold text-primary animate-[pulse_1s_infinite]">
                {gameState.countdownValue <= 0 ? 'GO!' : gameState.countdownValue}
              </div>
            </div>
          )}

          {gameState.phase !== 'finished' ? (
            <div className={`flex flex-col ${selectedMode.id === 'endless' ? 'xl:flex-row' : ''} h-full gap-6`}>
              <div className="flex flex-col flex-1">
              <ProgressHeader 
                currentIndex={gameState.currentIndex}
                totalCards={gameState.cards.length}
                correctCount={gameState.correctCount}
                streak={gameState.streak}
                mode={selectedMode}
                totalScore={gameState.totalScore}
                results={gameState.results}
              />

              {selectedMode.id === 'endless' && (
                <div className="px-4 py-2 flex flex-col gap-3 max-w-[600px] w-full mx-auto">
                  {/* Fuse */}
                  <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-50 ease-linear ${
                        gameState.timeLeftMs / gameState.maxTimeMs > 0.5 ? 'bg-success' : 
                        gameState.timeLeftMs / gameState.maxTimeMs > 0.25 ? 'bg-warning' : 'bg-danger animate-pulse'
                      }`}
                      style={{ width: `${(gameState.timeLeftMs / gameState.maxTimeMs) * 100}%` }}
                    />
                  </div>
                  {/* Hearts & Combo */}
                  <div className="flex justify-between items-center px-1">
                    <div className="flex gap-1.5">
                      {[...Array(3)].map((_, i) => (
                        <Heart 
                          key={i} 
                          className={`w-5 h-5 transition-all duration-300 ${
                            i < gameState.hearts 
                              ? 'text-danger fill-danger drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' 
                              : 'text-border-subtle fill-transparent'
                          }`} 
                        />
                      ))}
                    </div>
                    {gameState.perfectStreak > 0 && (
                      <span className="text-xs text-primary font-semibold tracking-wide animate-pulse">
                        COMBO {gameState.perfectStreak}/15
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
                {selectedMode.id === 'endless' ? (
                  <Flashcard 
                    char={gameState.currentCard}
                    phase={gameState.phase}
                    isCorrect={gameState.isCorrect}
                    settings={settings}
                  />
                ) : selectedMode.hasTimer ? (
                  <TimerRing timeLeftMs={gameState.timeLeftMs} totalTimeMs={selectedMode.timerSeconds! * 1000} size={260}>
                    <Flashcard 
                      char={gameState.currentCard}
                      phase={gameState.phase}
                      isCorrect={gameState.isCorrect}
                      settings={settings}
                    />
                  </TimerRing>
                ) : (
                  <Flashcard 
                    char={gameState.currentCard}
                    phase={gameState.phase}
                    isCorrect={gameState.isCorrect}
                    settings={settings}
                  />
                )}
              </div>

              <div className="pb-8 pt-4">
                {selectedMode.isMultipleChoice ? (
                  <ChoiceButtons 
                    choices={gameState.choices}
                    correctAnswer={gameState.currentCard?.romaji}
                    alternates={gameState.currentCard?.alternates || []}
                    selectedAnswer={gameState.selectedAnswer}
                    onSelect={gameState.handleAnswer}
                    disabled={gameState.phase === 'answered'}
                  />
                ) : (
                  <TypeInput 
                    char={gameState.currentCard}
                    onSubmit={gameState.handleAnswer}
                    disabled={gameState.phase === 'answered'}
                    phase={gameState.phase}
                    showHints={settings.showHints}
                  />
                )}
              </div>
              </div>

              {selectedMode.id === 'endless' && (
                <div className="hidden xl:flex w-[320px] h-full shrink-0">
                  <LiveLeaderboard currentScore={gameState.totalScore} leaderboardScores={leaderboardScores} />
                </div>
              )}
            </div>
          ) : (
            <ResultScreen 
              mode={selectedMode}
              results={gameState.results}
              correctCount={gameState.correctCount}
              totalScore={gameState.totalScore}
              maxStreak={gameState.maxStreak}
              totalElapsedMs={gameState.totalElapsedMs}
              isPersonalBest={gameState.isPersonalBest}
              onPlayAgain={handlePlayAgain}
              onChangeMode={handleQuit}
              onStudyWrong={(wrongResults) => handleStudySpecific(wrongResults.map(r => r.char))}
              onShare={setShareData}
              settings={settings}
            />
          )}
        </>
      )}

      {phase === 'words_landing' && (
        <WordsModeLanding 
          onSelectTier={handleSelectTier} 
          onQuit={handleQuit} 
        />
      )}

      {phase === 'word_builder' && selectedWordTier && selectedWordTier !== 'typing' && (
        <WordBuilder 
          tier={selectedWordTier as VocabTier}
          onQuit={handleQuit}
          onFinish={() => setPhase('words_landing')}
        />
      )}

      {phase === 'hardcore_typing' && (
        <HardcoreTyping 
          onQuit={handleQuit}
          onFinish={() => setPhase('words_landing')}
        />
      )}

      {phase === 'studying' && (
        <StudyModeUI 
          cards={studyChars || characterSet}
          settings={settings}
          onExit={handleQuit}
          onStudySpecific={(chars) => setStudyChars(chars)}
        />
      )}

      {phase === 'dictionary' && (
        <DictionaryMode 
          cards={studyChars || characterSet}
          settings={settings}
          onExit={handleQuit}
        />
      )}

      {isSettingsOpen && (
        <HiraganaSettingsPanel 
          settings={settings}
          onSave={saveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {shareData && (
        <ShareToFeedModal 
          gameId="hiragana"
          scoreDisplay={shareData.scoreDisplay}
          resultCard={
            <div className="text-center">
              <div className="font-heading font-bold text-4xl text-[#e11d48] leading-none mb-1">{shareData.scoreDisplay}</div>
              <div className="text-sm font-medium text-main">{shareData.modeName}</div>
            </div>
          }
          shareText={shareData.text}
          onClose={() => setShareData(null)}
          onShare={() => {}}
        />
      )}
    </HiraganaShell>
  );
}
