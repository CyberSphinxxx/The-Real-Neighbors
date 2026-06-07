import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type GameConfig } from '../../lib/gameUtils';

interface HowToPlayModalProps {
  game: GameConfig;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ game, onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-surface rounded-2xl border border-border-subtle shadow-lg w-full max-w-[420px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{game.icon}</span>
            <h2 className="font-heading font-bold text-lg text-main">{game.name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-elevated rounded-full text-muted hover:text-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <h3 className="text-xs text-muted uppercase tracking-wide mb-3 font-semibold">How to Play</h3>
          
          <div className="space-y-2 mb-4">
            {game.howToPlay.map((instruction, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-5 h-5 bg-primary/15 text-primary text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-sm text-main leading-snug">{instruction}</p>
              </div>
            ))}
          </div>

          <div 
            className="h-1 rounded-full mt-4 w-full" 
            style={{ backgroundColor: game.accentColor }} 
          />
        </div>

        <div className="p-4 pt-0">
          <button 
            className="w-full bg-primary text-on-primary rounded-full py-2.5 font-medium hover:brightness-110 transition-all"
            onClick={() => {
              onClose();
              navigate(`/games/${game.id}`);
            }}
          >
            Play Now →
          </button>
        </div>
      </div>
    </div>
  );
};
