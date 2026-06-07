import React, { useEffect } from 'react';
import { RefreshCw, Award, Target, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getSpeedLabel } from '../../../lib/typeracerUtils';
import { WPMGraph } from './WPMGraph';
import type { TypeRacerConfig } from '../../../hooks/useTypeRacer';

interface ResultScreenProps {
  config: TypeRacerConfig;
  netWPM: number;
  accuracy: number;
  errors: number;
  consistency: number;
  wpmHistory: { second: number; wpm: number }[];
  isPersonalBest: boolean;
  ghostResult: 'beat' | 'lost' | 'tie' | 'no_ghost';
  onRestart: () => void;
  onNewRace: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  config, netWPM, accuracy, errors, consistency, wpmHistory,
  isPersonalBest, ghostResult, onRestart, onNewRace
}) => {
  const speedLabel = getSpeedLabel(netWPM);

  useEffect(() => {
    if (isPersonalBest || ghostResult === 'beat') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isPersonalBest, ghostResult]);

  // Convert error character indices to seconds for the graph
  // Approximate based on characters typed over time, or just use the history if we recorded error seconds directly.
  // In our hook we recorded errors as indices. We'll simplify and not plot them if we don't have exact seconds.
  // We can pass empty array for now or approximate if needed.

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-500 pb-24">
      {isPersonalBest && (
        <div className="bg-gradient-to-r from-primary to-primary-hover text-white rounded-2xl p-4 mb-6 flex items-center justify-center gap-2 shadow-lg animate-bounce">
          <Award size={24} fill="currentColor" className="text-yellow-300" />
          <span className="font-bold text-lg">New Personal Best!</span>
        </div>
      )}

      {config.ghost && ghostResult !== 'no_ghost' && (
        <div className={`rounded-2xl p-4 mb-6 flex items-center justify-center gap-2 border ${
          ghostResult === 'beat' ? 'bg-success/10 border-success text-success' : 
          ghostResult === 'lost' ? 'bg-danger/10 border-danger text-danger' : 
          'bg-warning/10 border-warning text-warning'
        }`}>
          <span className="font-bold">
            {ghostResult === 'beat' ? `You beat ${config.ghost.displayName} by ${netWPM - config.ghost.netWPM} WPM!` : 
             ghostResult === 'lost' ? `${config.ghost.displayName} beat you by ${config.ghost.netWPM - netWPM} WPM.` : 
             `You tied with ${config.ghost.displayName}!`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="col-span-2 md:col-span-1 bg-surface rounded-2xl border border-border-subtle p-6 flex flex-col items-center justify-center shadow-sm">
          <span className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">WPM</span>
          <span className="text-5xl font-bold font-mono" style={{ color: speedLabel.color }}>{netWPM}</span>
          <span className="text-xs font-medium mt-2 px-3 py-1 rounded-full" style={{ backgroundColor: `${speedLabel.color}15`, color: speedLabel.color }}>
            {speedLabel.label}
          </span>
        </div>

        <div className="bg-surface rounded-2xl border border-border-subtle p-6 flex flex-col justify-center gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-1 text-muted mb-1"><Target size={14} /> <span className="text-xs font-semibold uppercase">Accuracy</span></div>
            <div className="text-2xl font-bold font-mono text-main">{accuracy}%</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted mb-1"><Activity size={14} /> <span className="text-xs font-semibold uppercase">Consistency</span></div>
            <div className="text-2xl font-bold font-mono text-main">{consistency}%</div>
          </div>
        </div>

        <div className="col-span-2 bg-surface rounded-2xl border border-border-subtle p-6 flex flex-col justify-center gap-2 shadow-sm">
           <div className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Race Details</div>
           <div className="flex justify-between text-sm">
             <span className="text-muted">Mode</span>
             <span className="font-medium text-main capitalize">{config.mode}</span>
           </div>
           <div className="flex justify-between text-sm">
             <span className="text-muted">Length/Time</span>
             <span className="font-medium text-main capitalize">{config.length || (config.timedDuration ? `${config.timedDuration}s` : 'N/A')}</span>
           </div>
           <div className="flex justify-between text-sm">
             <span className="text-muted">Errors</span>
             <span className={`font-bold ${errors > 0 ? 'text-danger' : 'text-success'}`}>{errors}</span>
           </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-main mb-4">Speed History</h3>
        {/* We approximate error seconds as empty for now or map them if available */}
        <WPMGraph 
          history={wpmHistory} 
          errors={[]} // could map errorPositions to time here if tracked
          ghostHistory={config.ghost ? 
            // Mock ghost history based on their netWPM (flat line) or reconstruct from timings
            [{second: 0, wpm: config.ghost.netWPM}, {second: wpmHistory.length > 0 ? wpmHistory[wpmHistory.length-1].second : 10, wpm: config.ghost.netWPM}] 
            : undefined} 
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 bg-surface hover:bg-elevated border border-border-subtle text-main px-6 py-3 rounded-full font-bold transition-all"
        >
          <RefreshCw size={18} /> Try Again
        </button>
        <button
          onClick={onNewRace}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all"
        >
          Next Race
        </button>
      </div>
    </div>
  );
};
