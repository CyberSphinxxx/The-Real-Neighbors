import React, { useMemo } from 'react';

interface CharacterDisplayProps {
  text: string;
  currentIndex: number;
  errors: Set<number>;
  blindMode: boolean;
}

export const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ text, currentIndex, errors, blindMode }) => {
  // Pre-calculate segments for performance and rendering
  const segments = useMemo(() => {
    const result = [];
    for (let i = 0; i < text.length; i++) {
      let status: 'typed' | 'error' | 'untyped' = 'untyped';
      if (errors.has(i)) status = 'error';
      else if (i < currentIndex) status = 'typed';

      result.push({ char: text[i], status, index: i });
    }
    return result;
  }, [text, currentIndex, errors]);

  return (
    <>
      {segments.map(({ char, status, index }) => {
        let className = 'transition-colors duration-75 relative ';
        
        if (status === 'typed') {
          className += 'text-muted'; // Default typed color
          if (blindMode) return null; // Hide completely in blind mode
        } else if (status === 'error') {
          className += 'text-danger bg-danger/20 rounded-sm underline decoration-danger underline-offset-2';
        } else {
          // Untyped
          className += 'text-main';
          if (char === ' ') {
            // Visualize spaces slightly differently if needed
          }
        }

        // Current character indicator (underneath)
        const isCurrent = index === currentIndex;

        return (
          <span key={index} className={className}>
            {char}
            {isCurrent && status !== 'error' && (
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-primary/50 animate-pulse" />
            )}
          </span>
        );
      })}
    </>
  );
};
