import React from 'react';

export const Feed: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-xl p-4 shadow-sm border border-border-subtle">
        <h2 className="text-lg font-heading font-semibold text-main">Create a post</h2>
        <div className="mt-3 flex gap-3">
          <div className="w-10 h-10 rounded-full bg-border-subtle flex-shrink-0"></div>
          <div className="flex-1 bg-base rounded-lg p-3 text-muted border border-border-subtle cursor-text">
            What's on your mind?
          </div>
        </div>
      </div>
      
      {/* Placeholder Post */}
      <div className="bg-surface rounded-xl p-4 shadow-sm border border-border-subtle">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
            TR
          </div>
          <div>
            <h3 className="font-semibold text-main text-sm">The Real</h3>
            <p className="text-xs text-muted">2 hours ago</p>
          </div>
        </div>
        <p className="text-main mb-4">
          Welcome to The Real Neighbors! This is a placeholder feed.
        </p>
      </div>
    </div>
  );
};

export default Feed;
