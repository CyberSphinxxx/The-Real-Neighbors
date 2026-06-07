import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import { getAppStats } from '../../../lib/firestore';
import type { AppStats } from '../../../types';

export const AppStatsCard: React.FC = () => {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAppStats();
        if (mounted) {
          if (data) {
            setStats({
              launchDate: data.launchDate || 'TBD',
              totalVibeChecks: data.totalVibeChecks || 0,
              highestGroupStreak: data.highestGroupStreak || 0,
              botbotMessagesProcessed: data.botbotMessagesProcessed || 0,
            });
          } else {
            // Document doesn't exist, use fallback
            setStats({
              launchDate: 'TBD',
              totalVibeChecks: 0,
              highestGroupStreak: 0,
              botbotMessagesProcessed: 0,
            });
          }
        }
      } catch (err) {
        if (mounted) {
          console.error("Failed to fetch app stats:", err);
          setError("Could not load neighborhood stats");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-6 h-full flex flex-col">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-2">
        <Activity size={16} /> Neighborhood Stats
      </h3>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3 text-red-500">
          <ShieldAlert size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <StatBox 
            label="Launch Date" 
            value={stats?.launchDate} 
            isLoading={isLoading} 
          />
          <StatBox 
            label="Vibe Checks" 
            value={stats?.totalVibeChecks?.toLocaleString()} 
            isLoading={isLoading} 
          />
          <StatBox 
            label="Highest Streak" 
            value={stats?.highestGroupStreak?.toLocaleString()} 
            isLoading={isLoading} 
          />
          <StatBox 
            label="AI Messages" 
            value={stats?.botbotMessagesProcessed?.toLocaleString()} 
            isLoading={isLoading} 
          />
        </div>
      )}
    </div>
  );
};

const StatBox: React.FC<{ label: string; value?: string | number; isLoading: boolean }> = ({ label, value, isLoading }) => (
  <div className="bg-base rounded-lg p-4 border border-border-subtle flex flex-col items-center justify-center text-center">
    <span className="text-xs text-muted mb-1">{label}</span>
    {isLoading ? (
      <div className="h-6 w-16 bg-surface-hover rounded animate-pulse" />
    ) : (
      <span className="text-xl font-bold text-main">{value}</span>
    )}
  </div>
);
