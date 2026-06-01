import React from 'react';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { Wifi } from 'lucide-react';
import { formatTimeAgo } from '../../utils/date';

const OnlineWidgetComponent: React.FC = () => {
  const { onlineUsers, offlineUsers } = useOnlineUsers();
  
  return (
    <div
      className="rounded-xl p-4 shadow-sm"
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted flex items-center">
          <Wifi size={14} className="mr-1.5" />
          Who's Online
        </h3>
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: 'var(--color-success)' }}
        />
      </div>

      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
        {/* Online Section */}
        {onlineUsers.map((u) => (
          <div key={u.uid} className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                style={{ background: u.avatarUrl ? undefined : u.avatarColor || 'var(--color-primary)' }}
              >
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  u.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full animate-pulse"
                style={{
                  background: 'var(--color-success)',
                  border: '1.5px solid var(--color-bg-surface)',
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-main">{u.displayName}</span>
              <span className="text-xs text-faint">Online now</span>
            </div>
          </div>
        ))}

        {/* Divider if we have offline users */}
        {offlineUsers.length > 0 && (
          <div
            className="w-full h-px my-1"
            style={{ background: 'var(--color-border-subtle)' }}
          />
        )}

        {/* Offline Section */}
        {offlineUsers.map((u) => (
          <div key={u.uid} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm grayscale opacity-50 flex-shrink-0"
              style={{ background: u.avatarUrl ? undefined : u.avatarColor || 'var(--color-primary)' }}
            >
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                u.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted">{u.displayName}</span>
              {u.privacyPrefs?.showLastSeen !== false && (
                <span className="text-xs text-faint">
                  {u.lastSeen ? `Last seen ${formatTimeAgo(u.lastSeen)}` : 'Offline'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const OnlineWidget = React.memo(OnlineWidgetComponent);
