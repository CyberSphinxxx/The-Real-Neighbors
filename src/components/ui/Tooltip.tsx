import React, { useState } from 'react';
import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Simple touch device detection
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  if (disabled || isTouchDevice) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative flex items-center justify-center group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className="absolute bottom-full mb-2 z-30 px-3 py-2 rounded-lg shadow-md text-xs whitespace-normal text-center"
          style={{ 
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-main)',
            border: '1px solid var(--color-border-default)',
            maxWidth: '200px',
            width: 'max-content'
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
