import React from 'react';
import type { SavedLink } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { Trash2, ArrowBigUp, ExternalLink } from 'lucide-react';

interface Props {
  link: SavedLink;
  usersMap: Record<string, string>;
  onDelete: (id: string) => void;
  onUpvote: (id: string, currentlyUpvoted: boolean) => void;
}

export const LinkCard: React.FC<Props> = ({ link, usersMap, onDelete, onUpvote }) => {
  const { user } = useAuthStore();
  
  const hasUpvoted = user ? link.votes?.includes(user.id) : false;
  const canDelete = user?.id === link.savedBy || user?.role === 'admin';

  let hostname = '';
  try {
    hostname = new URL(link.url).hostname;
  } catch (e) {
    hostname = link.url;
  }

  const faviconUrl = hostname 
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`
    : '';

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex gap-4 group">
      {/* Upvote Column */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => onUpvote(link.id, hasUpvoted)}
          className={`p-1 rounded-lg transition-all transform active:scale-75 ${
            hasUpvoted 
              ? 'text-primary bg-primary/10 hover:bg-primary/20 scale-110' 
              : 'text-muted hover:bg-base hover:text-main'
          }`}
          title={hasUpvoted ? "Remove upvote" : "Upvote"}
        >
          <ArrowBigUp className={hasUpvoted ? 'fill-primary' : ''} size={24} />
        </button>
        <span className={`text-sm font-bold ${hasUpvoted ? 'text-primary' : 'text-muted'}`}>
          {link.votes?.length || 0}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-4">
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 group/link"
            >
              {faviconUrl && <img loading="lazy" decoding="async" src={faviconUrl} alt="" className="w-5 h-5 rounded-sm bg-white flex-shrink-0" />}
              <h3 className="font-bold text-lg text-main group-hover/link:text-primary transition-colors leading-tight line-clamp-1">
                {link.title}
              </h3>
              <ExternalLink size={14} className="text-muted opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </a>
            
            {canDelete && (
              <button 
                onClick={() => onDelete(link.id)}
                className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary/80 hover:underline line-clamp-1 mt-0.5">
            {hostname}
          </a>

          {link.description && (
            <p className="text-muted text-sm mt-2 line-clamp-2">
              {link.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 mt-1">
          <div className="flex flex-wrap gap-1.5">
            {link.tags?.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/20">
                {tag}
              </span>
            ))}
          </div>

          <div className="text-xs text-faint flex-shrink-0">
            Saved by <span className="font-semibold text-muted">{usersMap[link.savedBy] || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
