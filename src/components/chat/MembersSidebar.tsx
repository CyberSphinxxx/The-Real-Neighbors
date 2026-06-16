import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';

import { getAvatarColor } from '../../utils/avatarColor';
import type { PresenceUser } from '../../hooks/useOnlineUsers';

interface MembersSidebarProps {
  onCloseMobile: () => void;
}

export const MembersSidebar: React.FC<MembersSidebarProps> = ({ onCloseMobile }) => {
  const navigate = useNavigate();
  const { onlineUsers, offlineUsers } = useOnlineUsers();

  const renderUser = (u: PresenceUser, isOnline: boolean) => (
    <button
      key={u.uid}
      onClick={() => {
        navigate(`/profile/${u.handle || u.uid}`);
        onCloseMobile();
      }}
      className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-elevated transition-colors group"
    >
      <div className="relative flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white overflow-hidden ${!isOnline ? 'opacity-50' : ''}`}
          style={{
            background: u.avatarUrl ? undefined : getAvatarColor(u.displayName),
          }}
        >
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            u.displayName.charAt(0).toUpperCase()
          )}
        </div>
        {isOnline && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full z-10"
            style={{
              background: 'var(--color-success)',
              border: '2px solid var(--color-bg-surface)',
            }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-medium truncate ${!isOnline ? 'text-muted' : 'text-main'}`}>
          {u.displayName}
        </p>
        {u.customTitle && (
          <p className="text-xs text-faint truncate">
            {u.customTitle}
          </p>
        )}
      </div>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border-subtle flex-shrink-0">
        <h2 className="font-semibold text-main truncate">Members</h2>
        <button 
          onClick={onCloseMobile}
          className="md:hidden p-1 text-muted hover:text-main"
        >
          <X size={20} />
        </button>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        {onlineUsers.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-faint uppercase tracking-wider px-2 mb-2">
              Online — {onlineUsers.length}
            </h3>
            <div className="space-y-0.5">
              {onlineUsers.map(u => renderUser(u, true))}
            </div>
          </div>
        )}

        {offlineUsers.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-faint uppercase tracking-wider px-2 mb-2">
              Offline — {offlineUsers.length}
            </h3>
            <div className="space-y-0.5">
              {offlineUsers.map(u => renderUser(u, false))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
