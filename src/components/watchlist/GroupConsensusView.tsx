import React, { useMemo } from 'react';
import type { WatchlistEntry } from '../../types';
import { Users, Star, StarHalf } from 'lucide-react';

interface Props {
  entries: WatchlistEntry[];
  usersMap: Record<string, string>;
}

interface GroupedEntry {
  title: string;
  coverUrl?: string;
  entries: WatchlistEntry[];
  averageRating: number;
  totalRatings: number;
  isGroupPick: boolean;
}

export const GroupConsensusView: React.FC<Props> = ({ entries, usersMap }) => {
  const groupedData = useMemo(() => {
    const map = new Map<string, GroupedEntry>();

    entries.forEach(entry => {
      const normalizedTitle = entry.title.trim().toLowerCase();
      
      if (!map.has(normalizedTitle)) {
        map.set(normalizedTitle, {
          title: entry.title,
          coverUrl: entry.coverUrl,
          entries: [],
          averageRating: 0,
          totalRatings: 0,
          isGroupPick: false,
        });
      }

      const group = map.get(normalizedTitle)!;
      group.entries.push(entry);
      
      if (entry.coverUrl && !group.coverUrl) {
        group.coverUrl = entry.coverUrl;
      }
    });

    const groups = Array.from(map.values()).map(group => {
      let ratingSum = 0;
      let ratingCount = 0;
      
      group.entries.forEach(e => {
        if (e.status === 'finished' && e.rating) {
          ratingSum += e.rating;
          ratingCount++;
        }
      });

      // A title is a group pick if 2 or more DIFFERENT users have added it
      const uniqueUsers = new Set(group.entries.map(e => e.userId));
      
      return {
        ...group,
        averageRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
        totalRatings: ratingCount,
        isGroupPick: uniqueUsers.size >= 2,
      };
    });

    // Sort: Group Picks first -> Avg Rating Desc -> Alphabetical
    return groups.sort((a, b) => {
      if (a.isGroupPick !== b.isGroupPick) return a.isGroupPick ? -1 : 1;
      if (a.averageRating !== b.averageRating) return b.averageRating - a.averageRating;
      return a.title.localeCompare(b.title);
    });
  }, [entries]);

  const renderStars = (rating: number) => {
    if (!rating) return <span className="text-muted text-sm italic">Unrated</span>;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={16} className="fill-warning text-warning" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" size={16} className="fill-warning text-warning" />);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="text-muted" />);
    }
    return <div className="flex items-center gap-0.5">{stars} <span className="ml-2 font-bold text-main">{rating.toFixed(1)}</span></div>;
  };

  if (groupedData.length === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-border-subtle rounded-2xl">
        <Users className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-main mb-2">No entries yet</h3>
        <p className="text-muted max-w-md mx-auto">Once people start adding shows to their watchlists, you'll see group favorites here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 pt-4">
      {groupedData.map((group, idx) => (
        <div key={idx} className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm flex">
          {/* Cover */}
          <div className="w-32 bg-base border-r border-border-subtle relative flex-shrink-0">
            {group.coverUrl ? (
              <img src={group.coverUrl} alt={group.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-4xl font-black uppercase shadow-inner">
                {group.title.charAt(0)}
              </div>
            )}
            
            {group.isGroupPick && (
              <div className="absolute top-2 left-2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1 uppercase tracking-wider">
                <Users size={12} /> Group Pick
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
            <div>
              <h3 className="font-bold text-lg text-main leading-tight mb-2 truncate">{group.title}</h3>
              {renderStars(group.averageRating)}
              {group.totalRatings > 0 && <p className="text-xs text-muted mt-1">From {group.totalRatings} rating{group.totalRatings !== 1 ? 's' : ''}</p>}
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">On Watchlists:</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(group.entries.map(e => e.userId))).map(uid => (
                  <span key={uid} className="text-xs bg-base border border-border-subtle px-2 py-0.5 rounded-full text-main truncate max-w-[100px]">
                    {usersMap[uid] || 'Unknown'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
