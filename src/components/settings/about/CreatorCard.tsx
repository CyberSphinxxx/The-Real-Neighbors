import React from 'react';
import { GitBranch, Code, Wallet } from 'lucide-react';

export const CreatorCard: React.FC = () => {
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-6 flex flex-col gap-4 h-full">
      <div>
        <h3 className="text-xl font-heading font-bold text-main">CyberSphinxxx</h3>
        <p className="text-sm text-muted mt-1">
          Full-stack developer currently ranked 19th among active GitHub committers in the Philippines. Passionate about building robust, modern web apps.
        </p>
      </div>
      
      <div className="flex gap-3 mt-2">
        <a 
          href="https://github.com/CyberSphinxxx" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 bg-base rounded-lg border border-border-subtle hover:bg-surface-hover text-muted hover:text-main transition-colors"
          title="GitHub Profile"
        >
          <GitBranch size={20} />
        </a>
        <a 
          href="https://github.com/CyberSphinxxx?tab=repositories" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 bg-base rounded-lg border border-border-subtle hover:bg-surface-hover text-muted hover:text-main transition-colors"
          title="Other Projects (CodeSplit, pinoy-dev-quotes-api)"
        >
          <Code size={20} />
        </a>
        <button 
          className="p-2 bg-base rounded-lg border border-border-subtle hover:bg-surface-hover text-muted hover:text-main transition-colors"
          title="Tip / GCash Placeholder"
        >
          <Wallet size={20} />
        </button>
      </div>
    </div>
  );
};
