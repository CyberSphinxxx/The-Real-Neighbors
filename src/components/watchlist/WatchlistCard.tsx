import React from 'react';
import type { WatchlistEntry } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { Star, StarHalf, Edit2, Trash2 } from 'lucide-react';

interface Props {
  entry: WatchlistEntry;
  onEdit?: (entry: WatchlistEntry) => void;
  onDelete?: (id: string) => void;
  usersMap?: Record<string, string>; // Maps userId -> displayName for recommender
}

export const WatchlistCard: React.FC<Props> = ({ entry, onEdit, onDelete, usersMap }) => {
  const { user } = useAuthStore();
  const isOwner = user?.id === entry.userId;

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={14} className="fill-warning text-warning" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" size={14} className="fill-warning text-warning" />);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={14} className="text-muted" />);
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching': return 'bg-primary/20 text-primary border-primary/30';
      case 'finished': return 'bg-success/20 text-success border-success/30';
      case 'planned': return 'bg-muted/20 text-muted border-border-subtle';
      default: return 'bg-base text-main border-border-subtle';
    }
  };

  const recommenderName = entry.recommendedBy && usersMap ? usersMap[entry.recommendedBy] : null;

  return (
    <div className="group relative bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full">
      {/* Cover Image */}
      <div className="aspect-[2/3] w-full bg-base border-b border-border-subtle relative overflow-hidden flex-shrink-0">
        {entry.coverUrl ? (
          <img 
            src={entry.coverUrl} 
            alt={entry.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-4xl font-black uppercase shadow-inner">
            {entry.title.charAt(0)}
          </div>
        )}
        
        {/* Status Badge overlay */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${getStatusColor(entry.status)}`}>
            {entry.status}
          </span>
        </div>

        {/* Actions overlay */}
        {isOwner && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onEdit?.(entry)}
              className="p-1.5 rounded-lg bg-surface/80 backdrop-blur text-main hover:text-primary transition-colors shadow-sm"
              title="Edit entry"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={() => onDelete?.(entry.id)}
              className="p-1.5 rounded-lg bg-surface/80 backdrop-blur text-main hover:text-danger transition-colors shadow-sm"
              title="Delete entry"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 gap-2 justify-between">
        <div>
          <h3 className="font-bold text-main leading-tight line-clamp-2">{entry.title}</h3>
          
          {entry.status === 'finished' && entry.rating && (
            <div className="mt-1.5">
              {renderStars(entry.rating)}
            </div>
          )}
        </div>

        {recommenderName && (
          <div className="text-xs text-muted mt-2 border-t border-border-subtle pt-2">
            <span className="font-medium">Recommended by:</span> {recommenderName}
          </div>
        )}
      </div>
    </div>
  );
};
