import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BotbotRateLimitState {
  lastReactionTime: number;
  setLastReactionTime: (time: number) => void;
  canReact: () => boolean;
}

export const useBotbotRateLimit = create<BotbotRateLimitState>()(
  persist(
    (set, get) => ({
      lastReactionTime: 0,
      setLastReactionTime: (time) => set({ lastReactionTime: time }),
      canReact: () => {
        const now = Date.now();
        const last = get().lastReactionTime;
        // 10 minutes cooldown globally
        return now - last >= 10 * 60 * 1000;
      },
    }),
    {
      name: 'botbot-ratelimit-storage',
    }
  )
);
