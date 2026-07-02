import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Sparkles, Tv, Rss, Calendar, Music2, CheckSquare, Flame, MessageCircle } from 'lucide-react';
import { BotbotChat } from '../components/ai/BotbotChat';
import { CaptionGenerator } from '../components/ai/CaptionGenerator';
import { FeedCatchUp } from '../components/ai/FeedCatchUp';
import { PollGenerator } from '../components/ai/PollGenerator';
import { WatchlistPicks } from '../components/ai/WatchlistPicks';
import { PlaylistMatcher } from '../components/ai/PlaylistMatcher';
import { EventPlanner } from '../components/ai/EventPlanner';
import { RoastMode } from '../components/ai/RoastMode';
import { useUsers } from '../hooks/useUsers';

const tools = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'caption', label: 'Caption Generator', icon: Sparkles },
  { id: 'watchlist', label: 'Watchlist Picks', icon: Tv },
  { id: 'feed', label: 'Feed Catch-Up', icon: Rss },
  { id: 'planner', label: 'Event Planner', icon: Calendar },
  { id: 'playlist', label: 'Playlist Matcher', icon: Music2 },
  { id: 'poll', label: 'Poll Generator', icon: CheckSquare },
  { id: 'roast', label: 'Roast Mode', icon: Flame },
];

export default function AIPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState(searchParams.get('tool') || 'chat');
  const { users } = useUsers();

  useEffect(() => {
    const tool = searchParams.get('tool');
    if (tool && tool !== activeTool) {
      setActiveTool(tool);
    }
  }, [searchParams]);

  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId);
    setSearchParams({ tool: toolId });
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-base">
      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden bg-base relative">
        {activeTool === 'chat' && <BotbotChat />}
        {activeTool === 'caption' && <div className="h-full overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto custom-scrollbar"><CaptionGenerator /></div>}
        {activeTool === 'feed' && <div className="h-full overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto custom-scrollbar"><FeedCatchUp /></div>}
        {activeTool === 'poll' && <div className="h-full overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto custom-scrollbar"><PollGenerator /></div>}
        {activeTool === 'watchlist' && <div className="h-full overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto custom-scrollbar"><WatchlistPicks users={users} /></div>}
        {activeTool === 'playlist' && <div className="h-full overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto custom-scrollbar"><PlaylistMatcher users={users} /></div>}
        {activeTool === 'planner' && <div className="h-full overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto custom-scrollbar"><EventPlanner /></div>}
        {activeTool === 'roast' && <div className="h-full overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto custom-scrollbar"><RoastMode users={users} /></div>}
      </div>

      {/* Right Mini-Sidebar */}
      <div className="w-[200px] flex-shrink-0 bg-surface/50 border-l border-border-subtle h-full p-3 flex flex-col">
        <div className="flex items-center gap-2 font-semibold text-sm text-main mb-4 px-2">
          <Bot className="w-4 h-4 text-primary" />
          <span>Botbot</span>
        </div>
        
        <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolChange(tool.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left text-sm transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted hover:bg-elevated'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
