import { create } from 'zustand';

interface SettingsState {
  bgPattern: string;
  fontSize: string;
  setBgPattern: (pattern: string) => void;
  setFontSize: (size: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  bgPattern: localStorage.getItem('bg-pattern') || 'none',
  fontSize: localStorage.getItem('font-size') || '14px',
  setBgPattern: (pattern) => {
    localStorage.setItem('bg-pattern', pattern);
    set({ bgPattern: pattern });
  },
  setFontSize: (size) => {
    localStorage.setItem('font-size', size);
    set({ fontSize: size });
  }
}));
