import React from 'react';
import { getSpeedLabel } from '../../../lib/typeracerUtils';

interface StatsBarProps {
  netWPM: number;
  accuracy: number;
  errors: number;
  timeLeft?: number;
  mode: string;
}

export const StatsBar: React.FC<StatsBarProps> = ({ netWPM, accuracy, errors, timeLeft, mode }) => {
  const speedLabel = getSpeedLabel(netWPM);

  return (
    <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border-subtle p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold font-mono" style={{ color: speedLabel.color }}>
          {netWPM}
        </span>
        <span className="text-sm font-semibold text-muted uppercase tracking-wider">WPM</span>
        <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full border hidden sm:inline-block" style={{ borderColor: speedLabel.color, color: speedLabel.color, backgroundColor: `${speedLabel.color}15` }}>
          {speedLabel.label}
        </span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {mode === 'timed' && timeLeft !== undefined && (
          <div className="flex flex-col items-end">
            <span className="text-sm text-muted">Time</span>
            <span className={`text-lg font-bold font-mono ${timeLeft <= 10 ? 'text-danger animate-pulse' : 'text-main'}`}>
              0:{timeLeft.toString().padStart(2, '0')}
            </span>
          </div>
        )}
        
        <div className="flex flex-col items-end">
          <span className="text-sm text-muted">Acc</span>
          <span className="text-lg font-bold font-mono text-main">{accuracy}%</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-sm text-muted">Err</span>
          <span className={`text-lg font-bold font-mono ${errors > 0 ? 'text-danger' : 'text-main'}`}>
            {errors}
          </span>
        </div>
      </div>
    </div>
  );
};
