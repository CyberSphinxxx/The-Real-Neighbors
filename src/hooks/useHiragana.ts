import { useState, useEffect, useCallback, useRef } from 'react';
import { type HiraganaChar } from '../lib/hiraganaData';
import { 
  shuffleArray, 
  generateChoices, 
  isCorrectAnswer, 
  calculateSpeedScore, 
  calculateTypeScore,
  generateAdaptiveCard
} from '../lib/hiraganaUtils';
import { submitScore, getPersonalBest } from '../lib/gameUtils';
import confetti from 'canvas-confetti';

export type HiraganaModeId = 'all' | 'speed' | 'type' | 'study' | 'dictionary' | 'endless' | 'words';

export interface HiraganaMode {
  id: HiraganaModeId;
  name: string;
  description: string;
  icon: string;
  cardCount: number | 'all' | 'endless';
  hasTimer: boolean;
  timerSeconds: number | null;
  isMultipleChoice: boolean;
  isTyping: boolean;
  submitsToLeaderboard: boolean;
  maxScore: number | null;
}

export interface HiraganaSettings {
  includeDakuten: boolean;
  includeCombinations: boolean;
  showHints: boolean;
  autoAdvance: boolean;
  fontStyle: 'sans' | 'serif';
  soundEnabled: boolean;
  volume: number;
}

export interface CardResult {
  char: HiraganaChar;
  userAnswer: string | null;
  isCorrect: boolean;
  timeMs: number;
  pointsEarned: number;
}

interface UseHiraganaProps {
  mode: HiraganaMode;
  characterSet: HiraganaChar[];
  settings: HiraganaSettings;
  sessionKey?: number | string;
  onFinish?: () => void;
}

const playSound = (type: 'correct' | 'wrong' | 'streak' | 'pb', volume: number, enabled: boolean) => {
  if (!enabled || typeof window === 'undefined' || !window.AudioContext) return;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const v = volume / 100;

  if (type === 'correct') {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3 * v, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start();
    osc2.start(ctx.currentTime + 0.1);
    osc1.stop(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.4);
  } else if (type === 'wrong') {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3 * v, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'streak') {
    // Simple ascending arpeggio
    const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.2 * v, ctx.currentTime + i * 0.1 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.2);
    });
  } else if (type === 'pb') {
    // Fanfare chord
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15 * v, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    });
  }
};

export function useHiragana({ mode, characterSet, settings, sessionKey, onFinish }: UseHiraganaProps) {
  const [phase, setPhase] = useState<'countdown' | 'playing' | 'answered' | 'finished'>('countdown');
  const [countdownValue, setCountdownValue] = useState(3);
  const [cards, setCards] = useState<HiraganaChar[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  
  const [hearts, setHearts] = useState(mode.id === 'endless' ? 3 : 0);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [maxTimeMs, setMaxTimeMs] = useState(mode.timerSeconds ? mode.timerSeconds * 1000 : 0);
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [results, setResults] = useState<CardResult[]>([]);
  
  const [totalScore, setTotalScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  
  const [timeLeftMs, setTimeLeftMs] = useState(mode.timerSeconds ? mode.timerSeconds * 1000 : 0);
  const [totalElapsedMs, setTotalElapsedMs] = useState(0);
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalTimerIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const currentCard = cards[currentIndex];

  // Initialize
  useEffect(() => {
    setPhase('countdown');
    setCountdownValue(3);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setStreak(0);
    setMaxStreak(0);
    setResults([]);
    setTotalScore(0);
    setCorrectCount(0);
    
    setHearts(mode.id === 'endless' ? 3 : 0);
    setPerfectStreak(0);
    const initialMaxTime = mode.id === 'endless' ? 10000 : (mode.timerSeconds ? mode.timerSeconds * 1000 : 0);
    setMaxTimeMs(initialMaxTime);
    setTimeLeftMs(initialMaxTime);
    
    setTotalElapsedMs(0);
    setIsPersonalBest(false);

    if (mode.id === 'endless') {
      const { card, choices: newChoices } = generateAdaptiveCard(1, settings);
      setCards([card]);
      setChoices(newChoices);
    } else {
      const initCards = mode.cardCount === 'all' 
        ? shuffleArray(characterSet)
        : shuffleArray(characterSet).slice(0, mode.cardCount as number);
        
      setCards(initCards);
      if (initCards.length > 0) {
        setChoices(generateChoices(initCards[0], characterSet));
      }
    }

    if (mode.submitsToLeaderboard) {
      getPersonalBest('hiragana').then(pb => {
        if (pb) {
          // Find if there's a score specifically for this submode?
          // The PB fetched is just the highest overall. Let's just use it, or fetch leaderboard.
          // For true accuracy we'd need to query with subMode, but getPersonalBest doesn't support subMode yet.
          // It's okay to just use the overall PB for celebration.
          setPreviousBest(pb.score);
        }
      });
    }

    // Start 3-2-1 countdown logic
    let count = 3;
    setCountdownValue(3);
    const countdownInterval = setInterval(() => {
      count--;
      setCountdownValue(count);
      if (count < 0) {
        clearInterval(countdownInterval);
        setPhase('playing');
        sessionStartRef.current = Date.now();
        startTimeRef.current = Date.now();
      }
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (totalTimerIntervalRef.current) clearInterval(totalTimerIntervalRef.current);
    };
  }, [mode, characterSet, sessionKey]);

  // Handle timer for timed modes
  useEffect(() => {
    if (phase === 'playing' && mode.hasTimer && mode.timerSeconds) {
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - (startTimeRef.current || Date.now());
        const remaining = Math.max(0, maxTimeMs - elapsed);
        setTimeLeftMs(remaining);
        
        if (remaining <= 0) {
          handleAnswer(null); // Timeout
        }
      }, 50);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase, currentIndex, mode]);

  // Handle total elapsed time for All mode (non-timed per card)
  useEffect(() => {
    if (phase === 'playing' && sessionStartRef.current && !mode.hasTimer) {
       totalTimerIntervalRef.current = setInterval(() => {
         setTotalElapsedMs(Date.now() - sessionStartRef.current!);
       }, 1000);
    } else {
       if (totalTimerIntervalRef.current) clearInterval(totalTimerIntervalRef.current);
    }
    return () => {
      if (totalTimerIntervalRef.current) clearInterval(totalTimerIntervalRef.current);
    }
  }, [phase, mode]);

  const nextCard = useCallback(() => {
    if (mode.id !== 'endless' && currentIndex + 1 >= cards.length) {
      setPhase('finished');
      if (totalTimerIntervalRef.current) clearInterval(totalTimerIntervalRef.current);
      if (sessionStartRef.current) {
        setTotalElapsedMs(Date.now() - sessionStartRef.current);
      }
      
      // Actually we should wait for state to settle, but we can do it in a useEffect when phase becomes 'finished'
      return;
    }

    let nextMaxTimeMs = mode.timerSeconds ? mode.timerSeconds * 1000 : 0;

    if (mode.id === 'endless') {
      const level = Math.floor((correctCount) / 5) + 1;
      const { card, choices: newChoices } = generateAdaptiveCard(level, settings);
      setCards(prev => [...prev, card]);
      setChoices(newChoices);
      nextMaxTimeMs = Math.max(2000, 10000 * Math.pow(0.95, correctCount));
      setMaxTimeMs(nextMaxTimeMs);
    } else {
      setChoices(generateChoices(cards[currentIndex + 1], characterSet));
    }

    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setPhase('playing');
    if (mode.hasTimer) {
      setTimeLeftMs(nextMaxTimeMs);
    }
    startTimeRef.current = Date.now();
  }, [currentIndex, cards, characterSet, mode, correctCount, totalScore, settings]);

  const handleAnswer = useCallback((answer: string | null) => {
    if (phase !== 'playing') return;
    
    setPhase('answered');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const timeTaken = Date.now() - (startTimeRef.current || Date.now());
    let correct = false;

    if (answer !== null) {
      if (mode.isMultipleChoice) {
        correct = answer === currentCard.romaji || currentCard.alternates.includes(answer);
      } else {
        correct = isCorrectAnswer(answer, currentCard);
      }
    }

    let points = 0;
    if (mode.id === 'all') {
      points = correct ? 1 : 0;
    } else if (mode.id === 'speed' && correct) {
      points = calculateSpeedScore(timeLeftMs, maxTimeMs);
    } else if (mode.id === 'type' && correct) {
      points = calculateTypeScore(timeLeftMs, maxTimeMs);
    } else if (mode.id === 'endless' && correct) {
      points = calculateSpeedScore(timeLeftMs, maxTimeMs);
    }

    setIsCorrect(correct);
    setSelectedAnswer(answer);

    setResults(prev => [...prev, {
      char: currentCard,
      userAnswer: answer,
      isCorrect: correct,
      timeMs: timeTaken,
      pointsEarned: points
    }]);

    const newCorrectCount = correctCount + (correct ? 1 : 0);
    const newTotalScore = totalScore + points;
    
    setCorrectCount(newCorrectCount);
    setTotalScore(newTotalScore);

    let newStreak = streak;
    let currentHearts = hearts;

    if (correct) {
      newStreak++;
      setStreak(newStreak);
      setMaxStreak(Math.max(maxStreak, newStreak));
      playSound('correct', settings.volume, settings.soundEnabled);
      if (newStreak === 3 || newStreak === 5 || newStreak === 10) {
        playSound('streak', settings.volume, settings.soundEnabled);
      }


    } else {
      setStreak(0);
      setPerfectStreak(0);
      playSound('wrong', settings.volume, settings.soundEnabled);
      
      if (mode.id === 'endless') {
        currentHearts--;
        setHearts(currentHearts);
      }
    }

    if (currentHearts <= 0 && mode.id === 'endless') {
      // Auto advance to finish quickly
      setTimeout(() => {
        setPhase('finished');
      }, 900);
    } else if (settings.autoAdvance || !correct) {
      // Small delay to show result
      setTimeout(() => {
        nextCard();
      }, 900);
    }
  }, [phase, currentCard, mode, timeLeftMs, maxTimeMs, correctCount, totalScore, streak, maxStreak, hearts, perfectStreak, settings, nextCard]);

  // Handle finished phase and score submission
  useEffect(() => {
    if (phase === 'finished' && mode.submitsToLeaderboard) {
      const finalScoreForLeaderboard = mode.id === 'all' ? (correctCount * 10) : totalScore;
      const isPB = previousBest === null || finalScoreForLeaderboard > previousBest;
      setIsPersonalBest(isPB);

      if (isPB) {
        playSound('pb', settings.volume, settings.soundEnabled);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#fbbf24', '#34d399']
        });
      }

      const totalElapsed = sessionStartRef.current ? Date.now() - sessionStartRef.current : 0;

      submitScore(
        'hiragana',
        finalScoreForLeaderboard,
        {
          mode: mode.id,
          correctCount,
          totalCards: cards.length,
          accuracy: (correctCount / cards.length) * 100,
          totalElapsedMs: totalElapsed,
          maxStreak,
          includedDakuten: settings.includeDakuten,
          includedCombinations: settings.includeCombinations,
          isPersonalBest: isPB
        },
        `${correctCount}/${cards.length} correct in ${mode.name}`
      ).then(() => {
        if (onFinish) onFinish();
      });
    }
  }, [phase, mode, correctCount, totalScore, cards.length, maxStreak, settings, previousBest, onFinish]);

  return {
    phase,
    countdownValue,
    cards,
    currentIndex,
    currentCard,
    choices,
    selectedAnswer,
    isCorrect,
    streak,
    perfectStreak,
    maxStreak,
    hearts,
    results,
    totalScore,
    correctCount,
    timeLeftMs,
    maxTimeMs,
    totalElapsedMs,
    isPersonalBest,
    previousBest,
    handleAnswer,
    nextCard
  };
}
