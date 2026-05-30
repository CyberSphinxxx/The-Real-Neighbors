import React from 'react';

export const PostSkeleton: React.FC = () => {
  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm animate-pulse mb-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-border-subtle flex-shrink-0" />
        <div className="flex-1 min-w-0 pt-1">
          <div className="h-4 bg-border-subtle rounded w-32 mb-2" />
          <div className="h-3 bg-border-subtle rounded w-24 mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-border-subtle rounded w-full" />
            <div className="h-4 bg-border-subtle rounded w-5/6" />
            <div className="h-4 bg-border-subtle rounded w-4/6" />
          </div>
          <div className="mt-4 flex gap-4">
            <div className="h-8 bg-border-subtle rounded-full w-16" />
            <div className="h-8 bg-border-subtle rounded-full w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};
