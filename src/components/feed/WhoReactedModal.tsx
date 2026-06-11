import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MobileBottomSheet } from '../ui/MobileBottomSheet';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { getTotalReactions, getReactionsByEmoji, getMembersByUids } from '../../utils/postHelpers';
import { getAvatarColor } from '../../utils/avatarColor';

interface WhoReactedModalProps {
  reactions: Record<string, string[]>;
  onClose: () => void;
}

export const WhoReactedModal: React.FC<WhoReactedModalProps> = ({ reactions, onClose }) => {
  const { onlineUsers, offlineUsers } = useOnlineUsers();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const totalReactions = getTotalReactions(reactions);
  const reactionGroups = getReactionsByEmoji(reactions);

  const displayedMembers = React.useMemo(() => {
    if (activeTab === 'all') {
      const all: { user: any, emoji: string }[] = [];
      reactionGroups.forEach(group => {
        const users = getMembersByUids(group.uids, onlineUsers, offlineUsers);
        users.forEach(u => all.push({ user: u, emoji: group.emoji }));
      });
      return all;
    } else {
      const group = reactionGroups.find(g => g.emoji === activeTab);
      if (!group) return [];
      const users = getMembersByUids(group.uids, onlineUsers, offlineUsers);
      return users.map(u => ({ user: u, emoji: activeTab }));
    }
  }, [activeTab, reactionGroups, onlineUsers, offlineUsers]);

  const modalContent = (
    <div 
      className="flex flex-col h-full bg-surface w-full overflow-hidden"
      style={!isMobile ? { borderRadius: '16px', border: '1px solid var(--color-border-subtle)', maxWidth: '400px', margin: 'auto', maxHeight: '80vh' } : undefined}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center">
          <span className="font-semibold text-base text-main">Reactions</span>
          <span className="text-muted text-sm ml-1">({totalReactions})</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-elevated text-muted hover:text-main transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {reactionGroups.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-3 shrink-0 custom-scrollbar border-b border-border-subtle">
          <button
            onClick={() => setActiveTab('all')}
            className="rounded-full px-3 py-1.5 text-sm flex items-center gap-1.5 whitespace-nowrap transition-colors border"
            style={{
              background: activeTab === 'all' ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'var(--color-bg-elevated)',
              color: activeTab === 'all' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderColor: activeTab === 'all' ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          >
            All {totalReactions}
          </button>
          {reactionGroups.map(g => (
            <button
              key={g.emoji}
              onClick={() => setActiveTab(g.emoji)}
              className="rounded-full px-3 py-1.5 text-sm flex items-center gap-1.5 whitespace-nowrap transition-colors border"
              style={{
                background: activeTab === g.emoji ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'var(--color-bg-elevated)',
                color: activeTab === g.emoji ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderColor: activeTab === g.emoji ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              {g.emoji} {g.count}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: isMobile ? undefined : '320px' }}>
        {totalReactions === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-muted text-sm">No reactions yet.</span>
            <span className="text-faint text-xs mt-1">Be the first to react! 👀</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {displayedMembers.map((item, i) => (
              <div 
                key={`${item.user.uid}-${item.emoji}-${i}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle hover:bg-elevated transition-colors last:border-b-0"
              >
                <div 
                  className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                  style={{ background: item.user.avatarUrl ? undefined : item.user.avatarColor || getAvatarColor(item.user.displayName) }}
                >
                  {item.user.avatarUrl ? (
                     <img src={item.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                     item.user.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="font-medium text-sm text-main truncate">{item.user.displayName}</span>
                  {activeTab === 'all' && (
                    <span className="text-base mt-0.5 leading-none">{item.emoji}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileBottomSheet isOpen={true} onClose={onClose} maxHeight="80vh">
        {modalContent}
      </MobileBottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-[400px]">
        {modalContent}
      </div>
    </div>
  );
};
