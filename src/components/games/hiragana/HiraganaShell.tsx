import React, { useState } from 'react';
import { GameShell } from '../GameShell';
import { useNavigate } from 'react-router-dom';

interface HiraganaShellProps {
  children: React.ReactNode;
  phase: string;
  subMode?: string;
  onQuit: () => void;
}

export const HiraganaShell: React.FC<HiraganaShellProps> = ({ children, phase, subMode, onQuit }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const handleBack = () => {
    if (phase === 'playing' || phase === 'studying') {
      setShowConfirm(true);
    } else if (phase === 'dictionary' || phase === 'finished') {
      onQuit();
    } else {
      navigate('/games');
    }
  };

  return (
    <>
      <GameShell 
        gameId="hiragana" 
        subMode={subMode}
        onBack={handleBack}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-base relative flex flex-col">
          {children}
        </div>
      </GameShell>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-2xl p-6 border border-border-subtle shadow-xl">
            <h3 className="font-heading font-bold text-xl text-main mb-2">Quit this round?</h3>
            <p className="text-muted text-sm mb-6">Your progress will be lost.</p>
            <div className="flex gap-3">
              <button 
                className="flex-1 bg-elevated hover:bg-surface-hover text-main font-semibold py-2.5 rounded-full transition-colors"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 bg-danger hover:bg-red-600 text-white font-semibold py-2.5 rounded-full transition-colors shadow-sm shadow-danger/20"
                onClick={() => {
                  setShowConfirm(false);
                  onQuit();
                }}
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
