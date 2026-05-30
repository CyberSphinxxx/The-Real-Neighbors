import React, { useState } from 'react';
import { Link as LinkIcon, Tv } from 'lucide-react';
import { LinksTab } from '../components/links/LinksTab';
import { WatchTogetherTab } from '../components/links/WatchTogetherTab';

export const LinksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'links' | 'watch'>('links');

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-main tracking-tight flex items-center gap-3">
          <LinkIcon className="text-primary" /> Hub
        </h1>
        <p className="text-sm text-muted mt-1">Save links and watch videos together.</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border-subtle pb-2">
        <button
          onClick={() => setActiveTab('links')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'links'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-muted hover:bg-base hover:text-main'
          }`}
        >
          <LinkIcon size={18} /> 🔗 Links
        </button>
        <button
          onClick={() => setActiveTab('watch')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'watch'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-muted hover:bg-base hover:text-main'
          }`}
        >
          <Tv size={18} /> 📺 Watch Together
        </button>
      </div>

      <div className="animate-in fade-in duration-300">
        {activeTab === 'links' ? <LinksTab /> : <WatchTogetherTab />}
      </div>
    </div>
  );
};

export default LinksPage;
