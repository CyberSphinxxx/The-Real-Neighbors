import React from 'react';

export const PostSkeleton: React.FC = () => {
  return (
    <div
      className="rounded-2xl p-5 animate-pulse"
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Author row */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0"
          style={{ background: 'var(--color-border-subtle)' }}
        />
        <div className="flex-1">
          <div
            className="h-3.5 rounded-full w-28 mb-2"
            style={{ background: 'var(--color-border-subtle)' }}
          />
          <div
            className="h-3 rounded-full w-16"
            style={{ background: 'var(--color-border-subtle)' }}
          />
        </div>
      </div>

      {/* Content lines */}
      <div className="space-y-2.5 mb-5">
        <div
          className="h-4 rounded-full w-full"
          style={{ background: 'var(--color-border-subtle)' }}
        />
        <div
          className="h-4 rounded-full w-5/6"
          style={{ background: 'var(--color-border-subtle)' }}
        />
        <div
          className="h-4 rounded-full w-3/4"
          style={{ background: 'var(--color-border-subtle)' }}
        />
      </div>

      {/* Reaction row */}
      <div className="flex items-center gap-2">
        {[72, 64, 72, 64, 60].map((w, i) => (
          <div
            key={i}
            className="h-9 rounded-full"
            style={{
              width: `${w}px`,
              background: 'var(--color-border-subtle)',
            }}
          />
        ))}
        <div
          className="h-9 rounded-full ml-auto"
          style={{ width: '96px', background: 'var(--color-border-subtle)' }}
        />
      </div>
    </div>
  );
};
