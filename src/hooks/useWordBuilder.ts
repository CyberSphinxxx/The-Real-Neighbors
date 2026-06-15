import { useState, useCallback, useEffect } from 'react';
import { type VocabularyItem, type VocabTier, VOCABULARY_DATA } from '../lib/vocabularyData';
import { shuffleArray } from '../lib/hiraganaUtils';
import { useProgressionStore } from '../stores/progressionStore';

export interface PillFragment {
  id: string; // Unique ID so React can track it moving between lists
  text: string;
}

export function useWordBuilder(tier: VocabTier) {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [bank, setBank] = useState<PillFragment[]>([]);
  const [dropZone, setDropZone] = useState<(PillFragment | null)[]>([]);
  
  const [phase, setPhase] = useState<'playing' | 'correct' | 'wrong' | 'finished'>('playing');
  const incrementBasic = useProgressionStore(s => s.incrementBasic);
  const incrementMedium = useProgressionStore(s => s.incrementMedium);

  // Initialize game
  useEffect(() => {
    // Filter by tier and pick 5 random words for a "session"
    const tierItems = VOCABULARY_DATA.filter(v => v.tier === tier);
    const sessionItems = shuffleArray(tierItems).slice(0, 5); // 5 words per session
    setItems(sessionItems);
    setCurrentIndex(0);
  }, [tier]);

  const currentItem = items[currentIndex];

  // Setup current word
  useEffect(() => {
    if (!currentItem) return;
    
    // Create unique pills
    const pills: PillFragment[] = currentItem.fragments.map((frag, idx) => ({
      id: `pill-${idx}-${frag}`,
      text: frag
    }));
    
    setBank(shuffleArray(pills));
    setDropZone(new Array(currentItem.fragments.length).fill(null));
    setPhase('playing');
  }, [currentItem]);

  const handleBankClick = useCallback((pill: PillFragment) => {
    if (phase !== 'playing') return;
    
    // Find first empty slot in drop zone
    const emptyIndex = dropZone.findIndex(p => p === null);
    if (emptyIndex === -1) return; // Drop zone full
    
    const newDropZone = [...dropZone];
    newDropZone[emptyIndex] = pill;
    setDropZone(newDropZone);
    
    setBank(prev => prev.filter(p => p.id !== pill.id));
  }, [dropZone, phase]);

  const handleDropZoneClick = useCallback((index: number) => {
    if (phase !== 'playing') return;
    
    const pill = dropZone[index];
    if (!pill) return;
    
    const newDropZone = [...dropZone];
    newDropZone[index] = null;
    setDropZone(newDropZone);
    
    setBank(prev => [...prev, pill]);
  }, [dropZone, phase]);

  // Auto-check when drop zone is full
  useEffect(() => {
    if (phase !== 'playing' || !currentItem) return;
    
    const isFull = dropZone.length > 0 && dropZone.every(p => p !== null);
    if (isFull) {
      const assembledText = dropZone.map(p => p!.text).join('');
      if (assembledText === currentItem.hiragana) {
        setPhase('correct');
        if (tier === 'basic') incrementBasic();
        if (tier === 'medium') incrementMedium();
      } else {
        setPhase('wrong');
      }
    }
  }, [dropZone, currentItem, phase, tier, incrementBasic, incrementMedium]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= items.length) {
      setPhase('finished');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, items.length]);

  const handleRetry = useCallback(() => {
    if (!currentItem) return;
    // Reset the current word
    const pills: PillFragment[] = currentItem.fragments.map((frag, idx) => ({
      id: `pill-${idx}-${frag}`,
      text: frag
    }));
    setBank(shuffleArray(pills));
    setDropZone(new Array(currentItem.fragments.length).fill(null));
    setPhase('playing');
  }, [currentItem]);

  return {
    currentItem,
    bank,
    dropZone,
    phase,
    handleBankClick,
    handleDropZoneClick,
    handleNext,
    handleRetry,
    progress: { current: currentIndex, total: items.length }
  };
}
