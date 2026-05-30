import React from 'react';

export const LinkSkeleton: React.FC = () => {
  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm animate-pulse flex flex-col sm:flex-row gap-4 h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-3 w-full">
            <div className="w-6 h-6 rounded bg-border-subtle flex-shrink-0" />
            <div className="h-5 bg-border-subtle rounded w-3/4" />
          </div>
        </div>
        <div className="h-4 bg-border-subtle rounded w-full mb-2" />
        <div className="h-4 bg-border-subtle rounded w-5/6 mb-4" />
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="h-6 w-16 bg-border-subtle rounded-full" />
          <div className="h-6 w-20 bg-border-subtle rounded-full" />
        </div>
        <div className="flex items-center gap-2 mt-auto">
          <div className="w-5 h-5 rounded-full bg-border-subtle" />
          <div className="h-3 bg-border-subtle rounded w-24" />
        </div>
      </div>
      <div className="sm:border-l sm:border-border-subtle sm:pl-4 flex sm:flex-col items-center sm:justify-center gap-3">
        <div className="w-12 h-12 bg-border-subtle rounded-xl" />
      </div>
    </div>
  );
};
