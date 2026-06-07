import React from 'react';
import { Atom, FileCode2, Zap, Wind, Database, Sparkles } from 'lucide-react';

const TECH_STACK = [
  { name: 'React', icon: Atom, tooltip: 'The robust UI library powering our components.' },
  { name: 'TypeScript', icon: FileCode2, tooltip: 'Providing strict typing and safer code.' },
  { name: 'Vite', icon: Zap, tooltip: 'Lightning-fast build tool and dev server.' },
  { name: 'Tailwind CSS', icon: Wind, tooltip: 'Utility-first styling framework.' },
  { name: 'Firebase', icon: Database, tooltip: 'Realtime database and backend infrastructure.' },
  { name: 'DeepSeek', icon: Sparkles, tooltip: 'Powering Botbot\'s brain and AI features.' },
];

export const TechStackGrid: React.FC = () => {
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-6 h-full flex flex-col">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted mb-4">Tech Blueprint</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {TECH_STACK.map((tech) => (
          <div 
            key={tech.name}
            title={tech.tooltip}
            className="bg-base rounded-lg p-3 flex items-center gap-3 border border-border-subtle hover:scale-[1.02] hover:ring-1 hover:ring-primary transition-all cursor-default"
          >
            <div className="text-primary">
              <tech.icon size={20} />
            </div>
            <span className="text-sm font-medium text-main">{tech.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
