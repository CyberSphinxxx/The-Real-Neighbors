import { useState, useEffect } from 'react';
import { Sun, Moon, SunMoon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ThemeName = 'default' | 'dark' | 'amoled' | 'synthwave' | 'midnight' | 'forest' | 'sunset' | 'ocean' | 'crimson';

const THEME_ORDER: ThemeName[] = ['default', 'dark', 'amoled', 'synthwave', 'midnight', 'forest', 'sunset', 'ocean', 'crimson'];

function applyTheme(theme: ThemeName) {
  document.documentElement.classList.remove('dark', 'amoled', 'synthwave', 'midnight', 'forest', 'sunset', 'ocean', 'crimson');
  if (theme !== 'default') document.documentElement.classList.add(theme);
}

export function useTheme() {
  const [currentTheme, setCurrentThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('theme') as ThemeName | null;
    return saved && THEME_ORDER.includes(saved) ? saved : 'dark';
  });

  useEffect(() => {
    applyTheme(currentTheme);
  }, []);

  const setTheme = (theme: ThemeName) => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    setCurrentThemeState(theme);
  };

  const cycleTheme = () => {
    const idx = THEME_ORDER.indexOf(currentTheme);
    const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    setTheme(next);
  };

  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(currentTheme) + 1) % THEME_ORDER.length];

  const nextThemeLabel: Record<ThemeName, string> = {
    default: 'Switch to Dark',
    dark: 'Switch to AMOLED',
    amoled: 'Switch to Synthwave',
    synthwave: 'Switch to Midnight',
    midnight: 'Switch to Forest',
    forest: 'Switch to Sunset',
    sunset: 'Switch to Ocean',
    ocean: 'Switch to Crimson',
    crimson: 'Back to Light',
  };

  const themeIcon: LucideIcon =
    currentTheme === 'default' ? Sun : currentTheme === 'dark' ? Moon : SunMoon;

  return { currentTheme, setTheme, cycleTheme, themeIcon, nextTheme, nextThemeLabel: nextThemeLabel[currentTheme] };
}
