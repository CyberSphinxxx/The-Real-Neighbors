import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { type HiraganaChar } from '../../../lib/hiraganaData';
import { Flashcard } from './Flashcard';
import { type HiraganaSettings } from '../../../hooks/useHiragana';

interface StudyModeProps {
  cards: HiraganaChar[];
  settings: HiraganaSettings;
  onExit: () => void;
  onStudySpecific: (chars: HiraganaChar[]) => void;
}

export const StudyMode: React.FC<StudyModeProps> = ({
  cards,
  settings,
  onExit,
  onStudySpecific
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [learningIds, setLearningIds] = useState<Set<string>>(new Set());
  
  const currentCard = cards[currentIndex];
  const isComplete = currentIndex >= cards.length;

  // Load progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hiragana_study');
      if (saved) {
        const { known = [], learning = [] } = JSON.parse(saved);
        setKnownIds(new Set(known));
        setLearningIds(new Set(learning));
      }
    } catch (e) {
      console.error('Failed to load study progress', e);
    }
  }, []);

  // Save progress
  const saveProgress = (newKnown: Set<string>, newLearning: Set<string>) => {
    try {
      localStorage.setItem('hiragana_study', JSON.stringify({
        known: Array.from(newKnown),
        learning: Array.from(newLearning)
      }));
    } catch (e) {
      console.error('Failed to save study progress', e);
    }
  };

  const handleMark = (isKnown: boolean) => {
    if (!currentCard) return;

    const charId = currentCard.character;
    const newKnown = new Set(knownIds);
    const newLearning = new Set(learningIds);

    if (isKnown) {
      newKnown.add(charId);
      newLearning.delete(charId);
    } else {
      newLearning.add(charId);
      newKnown.delete(charId);
    }

    setKnownIds(newKnown);
    setLearningIds(newLearning);
    saveProgress(newKnown, newLearning);

    // Next card
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 150); // slight delay for smooth transition
  };

  const handleFocusLearning = () => {
    const learningChars = cards.filter(c => learningIds.has(c.character));
    if (learningChars.length > 0) {
      onStudySpecific(learningChars);
    }
  };

  if (isComplete) {
    const sessionLearningCount = cards.filter(c => learningIds.has(c.character)).length;
    
    return (
      <div className="max-w-md mx-auto w-full px-4 py-12 flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in-95">
        <div className="mb-6">
          {sessionLearningCount === 0 ? (
            <div className="text-6xl mb-4">🏆</div>
          ) : (
            <div className="text-6xl mb-4">📚</div>
          )}
          <h2 className="font-heading font-bold text-2xl text-main mb-2">
            Study Session Complete
          </h2>
          
          {sessionLearningCount === 0 ? (
            <p className="text-muted text-sm">
              Incredible! You know all {cards.length} characters in this set.
            </p>
          ) : (
            <p className="text-muted text-sm">
              You know <span className="text-green-500 font-semibold">{cards.length - sessionLearningCount}</span>, and are still learning <span className="text-amber-500 font-semibold">{sessionLearningCount}</span>.
            </p>
          )}
        </div>

        <div className="flex flex-col w-full gap-3 mt-6">
          {sessionLearningCount > 0 && (
            <button 
              className="w-full bg-primary hover:bg-primary-hover text-on-primary font-semibold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2"
              onClick={handleFocusLearning}
            >
              Focus on ones I'm learning
            </button>
          )}
          <button 
            className={`w-full ${sessionLearningCount === 0 ? 'bg-primary text-on-primary hover:bg-primary-hover' : 'bg-surface border-2 border-border hover:border-primary text-main'} font-semibold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2`}
            onClick={onExit}
          >
            <RefreshCw className="w-4 h-4" />
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const progressRatio = currentIndex / cards.length;

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-4 pb-8 pt-4">
      {/* Header Progress */}
      <div className="mb-8">
        <div className="w-full h-1 bg-elevated rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-faint">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="text-faint">
            Known: <span className="text-green-500">{knownIds.size}</span> · Learning: <span className="text-amber-500">{learningIds.size}</span>
          </span>
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <Flashcard 
          char={currentCard}
          phase="playing"
          isCorrect={null}
          settings={settings}
          studyMode={true}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(true)}
        />
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-col gap-3 min-h-[120px]">
        {!isFlipped ? (
          <button 
            className="w-full bg-surface border-2 border-border hover:border-primary text-main font-semibold py-4 rounded-xl transition-colors"
            onClick={() => setIsFlipped(true)}
          >
            Reveal Answer
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-2">
            <button 
              className="flex-1 bg-green-500/15 border-2 border-green-500 text-green-500 hover:bg-green-500/20 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              onClick={() => handleMark(true)}
            >
              <CheckCircle2 className="w-5 h-5" />
              Know it
            </button>
            <button 
              className="flex-1 bg-amber-500/15 border-2 border-amber-500 text-amber-500 hover:bg-amber-500/20 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              onClick={() => handleMark(false)}
            >
              <RefreshCw className="w-5 h-5" />
              Still learning
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
