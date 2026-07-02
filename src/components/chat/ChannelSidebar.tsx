import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, X } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../stores/authStore';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { getAvatarColor } from '../../utils/avatarColor';
import type { Channel, DirectMessage, User } from '../../types';

interface ChannelSidebarProps {
  channels: Channel[];
  dms: DirectMessage[];
  activeChannelId?: string;
  activeDmId?: string;
  onCloseMobile: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({ 
  channels, 
  dms,
  activeChannelId,
  activeDmId,
  onCloseMobile 
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { onlineUsers } = useOnlineUsers();
  const { users } = useUsers();

  const onlineIds = useMemo(() => new Set(onlineUsers.map(u => u.uid)), [onlineUsers]);

  const groupedChannels = useMemo(() => {
    const groups: Record<string, Channel[]> = {
      'General': [],
      'Interests': [],
      'Utility': [],
    };
    
    channels.forEach(channel => {
      const category = channel.category || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(channel);
    });
    
    return groups;
  }, [channels]);

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border-subtle flex-shrink-0">
        <h2 className="font-semibold text-main truncate">The Neighborhood</h2>
        <button 
          onClick={onCloseMobile}
          className="md:hidden p-1 text-muted hover:text-main"
        >
          <X size={20} />
        </button>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {Object.entries(groupedChannels).map(([category, categoryChannels]) => {
          if (categoryChannels.length === 0) return null;
          
          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between px-2 mb-1">
                <h3 className="text-xs font-semibold text-faint uppercase tracking-wider">
                  {category}
                </h3>
              </div>
              <div className="space-y-0.5">
                {categoryChannels.map(channel => {
                  const isActive = channel.id === activeChannelId;
                  
                  // For Phase 1: Badge logic can be added here if needed
                  const hasUnread = false; 

                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        navigate(`/chat/${channel.id}`);
                        onCloseMobile();
                      }}
                      className={`
                        w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors
                        ${isActive 
                          ? 'bg-elevated text-main font-medium' 
                          : 'text-muted hover:bg-elevated hover:text-main'
                        }
                      `}
                    >
                      <span className="text-lg flex-shrink-0 w-6 text-center">
                        {channel.emoji || <Hash size={16} className="inline-block" />}
                      </span>
                      <span className="truncate flex-1 text-left">{channel.name}</span>
                      {hasUnread && !isActive && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* DM List */}
        {dms.length > 0 && (
          <div className="space-y-1 mt-6">
            <div className="flex items-center justify-between px-2 mb-1">
              <h3 className="text-xs font-semibold text-faint uppercase tracking-wider">
                Direct Messages
              </h3>
            </div>
            <div className="space-y-0.5">
              {users.filter(u => u.id !== currentUser?.id).map(otherUser => {
                const dm = dms.find(d => d.participants.includes(otherUser.id));
                const isOnline = onlineIds.has(otherUser.id);
                const isActive = dm?.id === activeDmId;
                const hasUnread = dm && currentUser && dm.lastMessageAt > (dm.seenBy?.[currentUser.id] || 0);

                return (
                  <button
                    key={otherUser.id}
                    onClick={() => {
                      if (dm) {
                        navigate(`/chat/dm/${dm.id}`);
                        onCloseMobile();
                      } else {
                        import('../../lib/chat').then(({ initializeDM }) => {
                          initializeDM(currentUser!.id, otherUser.id).then(newDmId => {
                            navigate(`/chat/dm/${newDmId}`);
                            onCloseMobile();
                          });
                        });
                      }
                    }}
                    className={`
                      w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors
                      ${isActive 
                        ? 'bg-elevated text-main font-medium' 
                        : 'text-muted hover:bg-elevated hover:text-main'
                      }
                    `}
                  >
                    <div className="relative flex-shrink-0 w-8 h-8">
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center font-bold text-white overflow-hidden text-sm"
                        style={{ background: otherUser.avatarUrl ? undefined : getAvatarColor(otherUser.displayName) }}
                      >
                        {otherUser.avatarUrl ? (
                          <img src={otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          otherUser.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full z-10" style={{ background: 'var(--color-success)', border: '2px solid var(--color-bg-surface)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="truncate text-sm font-medium">{otherUser.displayName}</div>
                      <div className={`truncate text-xs ${hasUnread && !isActive ? 'font-bold text-main' : 'text-faint'}`}>
                        {dm?.lastMessage || 'Start a conversation'}
                      </div>
                    </div>
                    {hasUnread && !isActive && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
