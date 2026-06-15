import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressionState {
  wordsBasicCompleted: number;
  wordsMediumCompleted: number;
  incrementBasic: () => void;
  incrementMedium: () => void;
  isMediumUnlocked: boolean;
  isHardUnlocked: boolean;
}

export const useProgressionStore = create<ProgressionState>()(
  persist(
    (set) => ({
      wordsBasicCompleted: 0,
      wordsMediumCompleted: 0,
      
      incrementBasic: () => set((state) => ({ 
        wordsBasicCompleted: state.wordsBasicCompleted + 1,
        isMediumUnlocked: (state.wordsBasicCompleted + 1) >= 15 || state.isMediumUnlocked
      })),
      
      incrementMedium: () => set((state) => ({ 
        wordsMediumCompleted: state.wordsMediumCompleted + 1,
        isHardUnlocked: (state.wordsMediumCompleted + 1) >= 15 || state.isHardUnlocked
      })),
      
      isMediumUnlocked: false,
      isHardUnlocked: false,
    }),
    {
      name: 'hiragana_progression',
    }
  )
);
