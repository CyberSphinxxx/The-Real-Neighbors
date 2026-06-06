import React, { useState, useEffect, useRef } from 'react';
import type { WatchlistEntry } from '../../types';
import { WatchlistCard } from './WatchlistCard';
import { Play, CheckCircle2, ListTodo } from 'lucide-react';

interface Props {
  entries: WatchlistEntry[];
  usersMap: Record<string, string>;
  onEdit: (entry: WatchlistEntry) => void;
  onDelete: (id: string) => void;
  onCardClick?: (entry: WatchlistEntry) => void;
}

export const UserWatchlist: React.FC<Props> = ({ entries, usersMap, onEdit, onDelete, onCardClick }) => {
  const [activeTab, setActiveTab] = useState<'watching' | 'finished' | 'planned'>('watching');
  const prevEntries = useRef(entries);

  useEffect(() => {
    if (prevEntries.current.length < entries.length) {
      // Entry added
      const added = entries.find(e => !prevEntries.current.some(p => p.id === e.id));
      if (added && added.status) {
        setActiveTab(added.status as 'watching' | 'finished' | 'planned');
      }
    } else if (prevEntries.current.length === entries.length) {
      // Entry modified
      const modified = entries.find(e => {
        const prev = prevEntries.current.find(p => p.id === e.id);
        return prev && prev.status !== e.status;
      });
      if (modified && modified.status) {
        setActiveTab(modified.status as 'watching' | 'finished' | 'planned');
      }
    }
    prevEntries.current = entries;
  }, [entries]);

  const watching = entries.filter(e => e.status === 'watching');
  const finished = entries.filter(e => e.status === 'finished');
  const planned = entries.filter(e => e.status === 'planned');

  const getActiveEntries = () => {
    switch (activeTab) {
      case 'watching': return watching;
      case 'finished': return finished;
      case 'planned': return planned;
      default: return [];
    }
  };

  const activeEntries = getActiveEntries();

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Status Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2">
        <button
          onClick={() => setActiveTab('watching')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all flex-shrink-0 ${
            activeTab === 'watching'
              ? 'bg-primary/10 text-primary border-b-2 border-primary shadow-sm'
              : 'bg-surface border-b-2 border-transparent text-muted hover:bg-base hover:text-main'
          }`}
        >
          <Play size={16} className={activeTab === 'watching' ? 'fill-primary' : ''} /> 
          Watching ({watching.length})
        </button>

        <button
          onClick={() => setActiveTab('finished')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all flex-shrink-0 ${
            activeTab === 'finished'
              ? 'bg-success/10 text-success border-b-2 border-success shadow-sm'
              : 'bg-surface border-b-2 border-transparent text-muted hover:bg-base hover:text-main'
          }`}
        >
          <CheckCircle2 size={16} className={activeTab === 'finished' ? 'fill-success' : ''} /> 
          Finished ({finished.length})
        </button>

        <button
          onClick={() => setActiveTab('planned')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all flex-shrink-0 ${
            activeTab === 'planned'
              ? 'bg-elevated text-main border-b-2 border-border shadow-sm'
              : 'bg-surface border-b-2 border-transparent text-muted hover:bg-base hover:text-main'
          }`}
        >
          <ListTodo size={16} /> 
          Planned ({planned.length})
        </button>
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-4 animate-in fade-in duration-200">
        {activeEntries.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border-subtle rounded-xl text-muted text-sm">
            Nothing here yet
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {activeEntries.map(entry => (
              <div 
                key={entry.id} 
                onClick={() => onCardClick?.(entry)}
                className="cursor-pointer h-full"
              >
                <WatchlistCard 
                  entry={entry} 
                  usersMap={usersMap}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
