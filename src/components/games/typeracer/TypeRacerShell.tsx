import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GAMES_CONFIG, isMobileDevice } from '../../../lib/gameUtils';
import { TypeRacerSettings } from './TypeRacerSettings';

interface TypeRacerShellProps {
  children: React.ReactNode;
}

export const TypeRacerShell: React.FC<TypeRacerShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const game = GAMES_CONFIG.find(g => g.id === 'typeracer');
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!game) return <div>Game not found</div>;

  const isMobile = isMobileDevice();
  const showMobileWarning = !game.isMobileFriendly && isMobile;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Top Bar */}
      <div className="mt-4 mx-4 mb-2 h-14 bg-surface/80 backdrop-blur-md border border-border-subtle rounded-2xl flex items-center justify-between px-5 flex-shrink-0 z-10 shadow-sm relative">
        <button 
          onClick={() => navigate('/games')}
          className="flex items-center gap-2 text-muted hover:text-main transition-colors bg-elevated/50 hover:bg-elevated px-3 py-1.5 rounded-xl border border-transparent hover:border-border-subtle"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">Games</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xl">{game.icon}</span>
          <span className="font-semibold text-sm text-main">{game.name}</span>
        </div>

        <div className="min-w-[100px] flex justify-end">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-muted hover:text-main rounded-full hover:bg-elevated transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showMobileWarning && (
        <div className="bg-warning/10 border-b border-warning/20 p-2 flex items-center justify-center gap-2 text-warning text-xs">
          <AlertTriangle className="w-4 h-4" />
          <span>TypeRacer works best on desktop with a physical keyboard. Mobile experience may be limited.</span>
        </div>
      )}

      {/* Game Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {children}
      </div>

      {settingsOpen && (
        <TypeRacerSettings onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
};
