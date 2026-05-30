import React from 'react';
import type { WatchlistEntry } from '../../types';
import { WatchlistCard } from './WatchlistCard';
import { Play, CheckCircle2, ListTodo } from 'lucide-react';

interface Props {
  entries: WatchlistEntry[];
  usersMap: Record<string, string>;
  onEdit: (entry: WatchlistEntry) => void;
  onDelete: (id: string) => void;
}

export const UserWatchlist: React.FC<Props> = ({ entries, usersMap, onEdit, onDelete }) => {
  const watching = entries.filter(e => e.status === 'watching');
  const finished = entries.filter(e => e.status === 'finished');
  const planned = entries.filter(e => e.status === 'planned');

  const renderColumn = (title: string, icon: React.ReactNode, items: WatchlistEntry[], colorClass: string) => (
    <div className="flex flex-col flex-1 min-w-[280px]">
      <div className={`flex items-center gap-2 pb-3 border-b-2 mb-4 ${colorClass}`}>
        {icon}
        <h2 className="font-heading font-bold text-lg">{title} <span className="text-sm font-normal text-muted ml-2">({items.length})</span></h2>
      </div>
      
      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-border-subtle rounded-xl text-muted text-sm">
            Nothing here yet
          </div>
        ) : (
          items.map(entry => (
            <WatchlistCard 
              key={entry.id} 
              entry={entry} 
              usersMap={usersMap}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-4 overflow-hidden pt-4">
      {renderColumn('Watching', <Play className="fill-primary" size={20} />, watching, 'border-primary text-primary')}
      {renderColumn('Finished', <CheckCircle2 className="fill-success text-base" size={20} />, finished, 'border-success text-success')}
      {renderColumn('Planned', <ListTodo size={20} />, planned, 'border-border text-main')}
    </div>
  );
};
