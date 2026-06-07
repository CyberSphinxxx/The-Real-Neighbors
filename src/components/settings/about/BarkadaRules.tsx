import React from 'react';
import { Terminal } from 'lucide-react';

export const BarkadaRules: React.FC = () => {
  return (
    <div className="bg-base rounded-xl border border-border-subtle p-6 font-mono shadow-inner text-main h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-border-subtle pb-2 text-primary">
        <Terminal size={18} />
        <span className="text-sm tracking-widest uppercase">Barkada Rules</span>
      </div>
      <ol className="list-decimal pl-5 space-y-3 text-sm text-muted">
        <li>Thou shalt not leave the GC on 'seen' when someone asks a legit question.</li>
        <li>Spamming memes is highly encouraged, but read the room first.</li>
        <li>What happens in the group chat, stays in the group chat. No screenshots!</li>
      </ol>
    </div>
  );
};
