import React from 'react';

export const WatchlistSkeleton: React.FC = () => {
  return (
    <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm flex animate-pulse">
      <div className="w-24 h-36 bg-border-subtle flex-shrink-0" />
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="h-5 bg-border-subtle rounded w-3/4 mb-2" />
          <div className="h-4 bg-border-subtle rounded w-1/4 mb-3" />
          <div className="h-3 bg-border-subtle rounded w-1/2" />
        </div>
        <div className="flex justify-between items-end mt-4">
          <div className="h-4 bg-border-subtle rounded w-1/3" />
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-lg bg-border-subtle" />
            <div className="w-8 h-8 rounded-lg bg-border-subtle" />
          </div>
        </div>
      </div>
    </div>
  );
};
