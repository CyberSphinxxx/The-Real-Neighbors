import React from 'react';

interface TimerRingProps {
  timeLeftMs: number;
  totalTimeMs: number;
  size?: number;
  children: React.ReactNode;
}

export const TimerRing: React.FC<TimerRingProps> = ({ 
  timeLeftMs, 
  totalTimeMs, 
  size = 260,
  children
}) => {
  const radius = (size / 2) - 8;
  const circumference = 2 * Math.PI * radius;
  
  // Prevent division by zero and cap at 1
  const ratio = totalTimeMs > 0 ? Math.max(0, Math.min(1, timeLeftMs / totalTimeMs)) : 0;
  const strokeDashoffset = circumference * (1 - ratio);

  let colorClass = 'text-green-500';
  let pulseClass = '';
  
  if (ratio <= 0.3) {
    colorClass = 'text-red-500';
    pulseClass = 'animate-[pulse_0.5s_infinite]';
  } else if (ratio <= 0.6) {
    colorClass = 'text-yellow-500';
  }

  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* SVG Ring positioned absolutely around children */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ width: size, height: size, margin: `calc(50% - ${size/2}px)` }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`} 
          className="transform -rotate-90"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${colorClass} transition-all duration-[100ms] ease-linear ${pulseClass}`}
          />
        </svg>
      </div>

      {/* Children (Flashcard) */}
      <div className="z-10">
        {children}
      </div>

      {/* Timer Text below */}
      <div className={`absolute -bottom-16 flex flex-col items-center ${colorClass} ${pulseClass}`}>
        <span className="font-heading font-bold text-2xl leading-none">
          {secondsLeft}
        </span>
        <span className="text-faint text-xs">sec</span>
      </div>
    </div>
  );
};
