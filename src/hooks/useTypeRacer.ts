import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateNetWPM, calculateWPM, calculateAccuracy, getLeaderboardKey } from '../lib/typeracerUtils';
import { getWordsText } from '../lib/typeracerWords';
import { submitScore } from '../lib/gameUtils';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';

export interface GhostData {
  uid: string;
  displayName: string;
  avatarColor: string;
  netWPM: number;
  accuracy: number;
  keystrokeTimings: number[];
  text: string;
}

export interface TypeRacerConfig {
  mode: 'words' | 'quote' | 'timed' | 'zen';
  text: string;
  wordPack?: string;
  quotePack?: string;
  length?: 'short' | 'medium' | 'long' | 'timed';
  timedDuration?: number; // 30 or 60
  ghost?: GhostData | null;
}

export type GamePhase = 'countdown' | 'racing' | 'finished';

export function useTypeRacer(config: TypeRacerConfig) {
  const [phase, setPhase] = useState<GamePhase>('countdown');
  const [text, setText] = useState(config.text);
  const [input, setInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState<Set<number>>(new Set());
  const [errorCount, setErrorCount] = useState(0);
  
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timedDuration || 0);
  
  const [wpmHistory, setWpmHistory] = useState<{ second: number; wpm: number }[]>([]);
  const [rawWPM, setRawWPM] = useState(0);
  const [netWPM, setNetWPM] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  
  const [ghostPosition, setGhostPosition] = useState(0);
  
  const [keystrokeTimings, setKeystrokeTimings] = useState<number[]>([]);
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [ghostResult, setGhostResult] = useState<'beat' | 'lost' | 'tie' | 'no_ghost'>('no_ghost');
  
  // Audio references
  const audioContext = useRef<AudioContext | null>(null);
  
  // Settings
  const settingsStr = localStorage.getItem('typeracer_settings');
  const settings = settingsStr ? JSON.parse(settingsStr) : null;
  const soundEnabled = settings?.soundEnabled ?? false;
  const clickSound = settings?.clickSound ?? 'soft';
  const errorSound = settings?.errorSound ?? true;
  const stopOnError = settings?.stopOnError ?? false;
  const volume = (settings?.volume ?? 50) / 100;

  useEffect(() => {
    // Reset state when config changes (new race)
    setPhase('countdown');
    setText(config.text);
    setInput('');
    setCurrentIndex(0);
    setErrors(new Set());
    setErrorCount(0);
    setStartTime(null);
    setElapsedMs(0);
    setTimeLeft(config.timedDuration || 0);
    setWpmHistory([]);
    setRawWPM(0);
    setNetWPM(0);
    setAccuracy(100);
    setGhostPosition(0);
    setKeystrokeTimings([]);
    setIsPersonalBest(false);
    setGhostResult('no_ghost');

    // Fetch previous best
    if (config.mode !== 'zen') {
      const fetchBest = async () => {
        try {
          const user = useAuthStore.getState().user;
          if (!user) return;
          const key = getLeaderboardKey(config.mode, config.wordPack || config.quotePack || 'mixed', config.length || 'medium');
          const ghostRef = doc(db, `typeracerGhosts/${user.id}_${key}`);
          const snap = await getDoc(ghostRef);
          if (snap.exists()) {
            setPreviousBest(snap.data().netWPM);
          } else {
            setPreviousBest(null);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchBest();
    }
  }, [config]);

  // Audio helper
  const playSound = useCallback((type: 'click' | 'error') => {
    if (!soundEnabled) return;
    
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContext.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'click') {
      if (clickSound === 'none') return;
      osc.type = clickSound === 'mechanical' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(clickSound === 'mechanical' ? 800 : 1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(clickSound === 'mechanical' ? 400 : 800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'error' && errorSound) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    }
  }, [soundEnabled, clickSound, errorSound, volume]);

  const finishRace = useCallback(async (finalStats: any) => {
    setPhase('finished');
    
    // Ghost outcome
    if (config.ghost) {
      if (finalStats.netWPM > config.ghost.netWPM) setGhostResult('beat');
      else if (finalStats.netWPM < config.ghost.netWPM) setGhostResult('lost');
      else setGhostResult('tie');
    }

    if (config.mode === 'zen') return;

    const user = useAuthStore.getState().user;
    if (!user) return;

    const isNewBest = previousBest === null || finalStats.netWPM > previousBest;
    setIsPersonalBest(isNewBest);

    const metadata = {
      mode: config.mode,
      wordPack: config.wordPack || 'mixed',
      quotePack: config.quotePack || '',
      length: config.length || 'medium',
      timedDuration: config.timedDuration || 0,
      rawWPM: finalStats.rawWPM,
      netWPM: finalStats.netWPM,
      accuracy: finalStats.accuracy,
      consistency: finalStats.consistency,
      errors: finalStats.errorCount,
      correctChars: finalStats.correctChars,
      totalChars: finalStats.totalChars,
      timeTakenMs: finalStats.elapsedMs,
      wpmHistory: finalStats.wpmHistory,
      errorPositions: Array.from(finalStats.errors),
      text: finalStats.text,
      isPersonalBest: isNewBest,
      ghostRacedUid: config.ghost?.uid || null,
      ghostRacedWPM: config.ghost?.netWPM || null,
      ghostResult: config.ghost ? (finalStats.netWPM > config.ghost.netWPM ? 'beat' : (finalStats.netWPM < config.ghost.netWPM ? 'lost' : 'tie')) : 'no_ghost'
    };

    const summary = `Scored ${finalStats.netWPM} WPM with ${finalStats.accuracy}% accuracy in TypeRacer (${config.mode}).`;
    
    await submitScore('typeracer', finalStats.netWPM, metadata, summary);

    if (isNewBest) {
      const key = getLeaderboardKey(config.mode, config.wordPack || config.quotePack || 'mixed', config.length || 'medium');
      const ghostRef = doc(db, `typeracerGhosts/${user.id}_${key}`);
      await setDoc(ghostRef, {
        uid: user.id,
        displayName: user.displayName,
        avatarColor: user.accentColor || '#3b82f6',
        netWPM: finalStats.netWPM,
        accuracy: finalStats.accuracy,
        keystrokeTimings: finalStats.keystrokeTimings,
        text: finalStats.text,
        mode: config.mode,
        pack: config.wordPack || config.quotePack || 'mixed',
        length: config.length || 'medium',
        recordedAt: serverTimestamp()
      });
    }
  }, [config, previousBest]);

  // Main input handler
  const handleKeyPress = useCallback((key: string) => {
    if (phase !== 'racing') return;

    const expectedChar = text[currentIndex];

    // Backspace logic
    if (key === 'Backspace') {
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        setInput(prev => prev.slice(0, -1));
        
        // Remove error if it exists at the new position
        if (errors.has(newIndex)) {
          const newErrors = new Set(errors);
          newErrors.delete(newIndex);
          setErrors(newErrors);
        }
      }
      return;
    }

    // Filter out non-printable keys
    if (key.length !== 1) return;

    if (stopOnError && errors.has(currentIndex - 1)) {
      playSound('error');
      return; // Block if previous character is an error
    }

    const isCorrect = key === expectedChar;

    if (isCorrect) {
      playSound('click');
    } else {
      playSound('error');
      const newErrors = new Set(errors);
      newErrors.add(currentIndex);
      setErrors(newErrors);
      setErrorCount(prev => prev + 1);
    }

    setInput(prev => prev + key);
    
    // Record timing relative to start
    const currentMs = startTime ? Date.now() - startTime : 0;
    setKeystrokeTimings(prev => [...prev, currentMs]);
    
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);

    // End condition for words/quote
    if (config.mode !== 'timed' && newIndex === text.length) {
      // Calculate final stats right now to avoid async race condition
      const finalMs = currentMs || 1;
      const finalSeconds = finalMs / 1000;
      const finalRawWPM = calculateWPM(newIndex, finalSeconds);
      const finalNetWPM = calculateNetWPM(finalRawWPM, errorCount + (isCorrect ? 0 : 1), finalSeconds);
      const finalAccuracy = calculateAccuracy(newIndex - (errors.size + (isCorrect ? 0 : 1)), newIndex);

      finishRace({
        rawWPM: finalRawWPM,
        netWPM: finalNetWPM,
        accuracy: finalAccuracy,
        errorCount: errorCount + (isCorrect ? 0 : 1),
        correctChars: newIndex - (errors.size + (isCorrect ? 0 : 1)),
        totalChars: newIndex,
        elapsedMs: finalMs,
        consistency: 100, // calculated later or default
        wpmHistory,
        errors: isCorrect ? errors : new Set([...errors, currentIndex]),
        text,
        keystrokeTimings: [...keystrokeTimings, currentMs]
      });
    }

    // Infinite text for timed mode
    if (config.mode === 'timed' && newIndex >= text.length - 10) {
      setText(prev => prev + ' ' + getWordsText('mixed', 'short'));
    }
  }, [phase, text, currentIndex, errors, stopOnError, startTime, errorCount, config, keystrokeTimings, wpmHistory, playSound, finishRace]);

  // State ref for intervals to read without triggering effect recreation
  const stateRef = useRef({ currentIndex, errorCount, errors, text, keystrokeTimings, wpmHistory });
  useEffect(() => {
    stateRef.current = { currentIndex, errorCount, errors, text, keystrokeTimings, wpmHistory };
  });

  // Main timers
  useEffect(() => {
    if (phase !== 'racing' || !startTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentElapsedMs = now - startTime;
      setElapsedMs(currentElapsedMs);

      // Timed mode logic
      if (config.mode === 'timed') {
        const remaining = Math.max(0, (config.timedDuration || 60) * 1000 - currentElapsedMs);
        setTimeLeft(Math.ceil(remaining / 1000));
        
        if (remaining === 0) {
          clearInterval(interval);
          const finalSeconds = config.timedDuration || 60;
          
          // Read from ref to get the absolute latest state
          const current = stateRef.current;
          const finalRawWPM = calculateWPM(current.currentIndex, finalSeconds);
          const finalNetWPM = calculateNetWPM(finalRawWPM, current.errorCount, finalSeconds);
          const finalAccuracy = calculateAccuracy(current.currentIndex - current.errors.size, current.currentIndex);
          
          finishRace({
            rawWPM: finalRawWPM,
            netWPM: finalNetWPM,
            accuracy: finalAccuracy,
            errorCount: current.errorCount,
            correctChars: current.currentIndex - current.errors.size,
            totalChars: current.currentIndex,
            elapsedMs: currentElapsedMs,
            consistency: 100,
            wpmHistory: current.wpmHistory,
            errors: current.errors,
            text: current.text,
            keystrokeTimings: current.keystrokeTimings
          });
          return;
        }
      }

      const current = stateRef.current;

      // Live stats
      const seconds = currentElapsedMs / 1000;
      if (seconds > 0) {
        const raw = calculateWPM(current.currentIndex, seconds);
        const net = calculateNetWPM(raw, current.errorCount, seconds);
        const acc = calculateAccuracy(current.currentIndex - current.errors.size, current.currentIndex);
        
        setRawWPM(raw);
        setNetWPM(net);
        setAccuracy(acc);
      }

      // WPM History (every second)
      const currentSecond = Math.floor(seconds);
      if (current.wpmHistory.length === 0 || current.wpmHistory[current.wpmHistory.length - 1].second < currentSecond) {
        setWpmHistory(prev => {
          // ensure no duplicates
          if (prev.length > 0 && prev[prev.length - 1].second === currentSecond) return prev;
          return [...prev, { second: currentSecond, wpm: calculateNetWPM(calculateWPM(current.currentIndex, seconds), current.errorCount, seconds) }];
        });
      }

    }, 100);

    return () => clearInterval(interval);
  }, [phase, startTime, config, finishRace]);

  // Ghost tracker
  useEffect(() => {
    if (phase !== 'racing' || !config.ghost || !startTime) return;

    const ghostInterval = setInterval(() => {
      const currentElapsedMs = Date.now() - startTime;
      const timings = config.ghost!.keystrokeTimings;
      
      let newPos = 0;
      // Fast search from end or binary search could be used, but array is usually < 1000 elements
      for (let i = 0; i < timings.length; i++) {
        if (timings[i] <= currentElapsedMs) {
          newPos = i + 1; // It has typed this character
        } else {
          break;
        }
      }
      setGhostPosition(newPos);
    }, 50); // 20fps for smooth ghost

    return () => clearInterval(ghostInterval);
  }, [phase, startTime, config]);

  const startRace = useCallback(() => {
    setPhase('racing');
    setStartTime(Date.now());
  }, []);

  return {
    phase,
    text,
    input,
    currentIndex,
    errors,
    errorCount,
    elapsedMs,
    timeLeft,
    wpmHistory,
    rawWPM,
    netWPM,
    accuracy,
    ghostPosition,
    keystrokeTimings,
    isPersonalBest,
    ghostResult,
    handleKeyPress,
    startRace
  };
}
