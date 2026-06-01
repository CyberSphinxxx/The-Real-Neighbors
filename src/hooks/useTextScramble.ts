import { useState, useEffect, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export interface ScrambleChar {
  char: string;
  resolved: boolean;
}

export function useTextScramble(text: string, triggerDelay: number = 300) {
  // Initialize with empty strings or spaces, all unresolved
  const [items, setItems] = useState<ScrambleChar[]>(() =>
    text.split('').map((char) => ({
      char: char === ' ' ? ' ' : '',
      resolved: char === ' '
    }))
  );

  const frameRef = useRef<number>(0);

  useEffect(() => {
    let timeoutId: number;
    let frame = 0;
    
    const chars = text.split('');
    const length = chars.length;
    
    // Create a queue for when each character should start and stop scrambling
    const queue = chars.map((char, i) => {
      if (char === ' ') return { char: ' ', start: 0, end: 0 };
      
      // Stagger start times over ~60 frames
      const start = Math.floor((i / length) * 60); 
      // Each character scrambles for 3 to 8 cycles
      const cycles = Math.floor(Math.random() * 6) + 3; 
      const end = start + cycles;
      
      return { char, start, end };
    });

    const update = () => {
      let resolvedCount = 0;
      const nextItems = queue.map((q) => {
        if (q.char === ' ') {
          resolvedCount++;
          return { char: ' ', resolved: true };
        }
        
        if (frame >= q.end) {
          resolvedCount++;
          return { char: q.char, resolved: true };
        } else if (frame >= q.start) {
          return {
            char: CHARS[Math.floor(Math.random() * CHARS.length)],
            resolved: false
          };
        } else {
          return { char: '', resolved: false };
        }
      });

      setItems(nextItems);

      if (resolvedCount === length) {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      } else {
        frame++;
        frameRef.current = requestAnimationFrame(update);
      }
    };

    timeoutId = window.setTimeout(() => {
      frameRef.current = requestAnimationFrame(update);
    }, triggerDelay);

    return () => {
      window.clearTimeout(timeoutId);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [text, triggerDelay]);

  return items;
}
