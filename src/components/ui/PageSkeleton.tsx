import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-500 pt-6">
      <div className="w-48 h-8 bg-surface border border-border-subtle rounded-lg animate-pulse" />
      <div className="w-full h-40 bg-surface border border-border-subtle rounded-2xl animate-pulse" />
      <div className="w-full h-64 bg-surface border border-border-subtle rounded-2xl animate-pulse" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Loader2 className="w-8 h-8 text-primary animate-spin opacity-50" />
      </div>
    </div>
  );
};
