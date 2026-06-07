import { useState } from 'react';
import { GAMES_CONFIG, type GameCategory } from '../lib/gameUtils';
import { GameCard } from '../components/games/GameCard';
import { LeaderboardSection } from '../components/games/LeaderboardSection';
import { GameActivity } from '../components/games/GameActivity';

const SUBTITLES = [
  "Who's the most competent neighbor? 🏆",
  "Play. Compete. Flex on your friends.",
  "Kaya mo ba? 👀",
  "May laro tayo! 🎮",
  "Prove your worth, neighbor."
];

export default function GamesPage() {
  const [subtitle] = useState(() => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)]);
  const [activeFilter, setActiveFilter] = useState<'all' | GameCategory>('all');
  const [mobileOnly, setMobileOnly] = useState(false);

  const filteredGames = GAMES_CONFIG.filter(game => {
    if (activeFilter !== 'all' && game.category !== activeFilter) return false;
    if (mobileOnly && !game.isMobileFriendly) return false;
    return game.isAvailable;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl text-main">Game Room 🎮</h1>
          <p className="text-muted mt-1">{subtitle}</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex bg-surface p-1 rounded-full border border-border-subtle w-fit shadow-sm overflow-x-auto custom-scrollbar max-w-full">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === 'all'
                  ? 'bg-elevated text-main shadow-sm'
                  : 'text-muted hover:text-main'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('word')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === 'word'
                  ? 'bg-elevated text-main shadow-sm'
                  : 'text-muted hover:text-main'
                }`}
            >
              🔤 Word
            </button>
            <button
              onClick={() => setActiveFilter('trivia')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === 'trivia'
                  ? 'bg-elevated text-main shadow-sm'
                  : 'text-muted hover:text-main'
                }`}
            >
              🧠 Trivia
            </button>
            <button
              onClick={() => setActiveFilter('reflex')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === 'reflex'
                  ? 'bg-elevated text-main shadow-sm'
                  : 'text-muted hover:text-main'
                }`}
            >
              ⚡ Reflex
            </button>
          </div>

          <button
            onClick={() => setMobileOnly(!mobileOnly)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap w-fit ${mobileOnly
                ? 'bg-elevated text-primary border-primary'
                : 'bg-surface text-muted border-border-subtle hover:text-main'
              }`}
          >
            📱 Mobile Compatible
          </button>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {filteredGames.length > 0 ? (
            filteredGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted border border-dashed border-border-subtle rounded-2xl">
              No games found matching your filters.
            </div>
          )}
        </div>

        {/* Below Grid Sections */}
        <div className="mt-8 space-y-8">
          <LeaderboardSection />
          <GameActivity />
        </div>
      </div>
    </div>
  );
}
