import React, { useState, useEffect, useMemo } from 'react';
import { X, Eye, EyeOff, CheckCircle, Clock } from 'lucide-react';
import { MobileBottomSheet } from '../ui/MobileBottomSheet';
import { useOnlineUsers, type PresenceUser } from '../../hooks/useOnlineUsers';
import { getAvatarColor } from '../../utils/avatarColor';

interface WhoSeenItModalProps {
  seenBy: string[];
  postAuthorId: string;
  onClose: () => void;
}

export const WhoSeenItModal: React.FC<WhoSeenItModalProps> = ({ seenBy, postAuthorId, onClose }) => {
  const { onlineUsers, offlineUsers } = useOnlineUsers();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { seenMembers, unseenMembers, unseenCount, seenCount } = useMemo(() => {
    const allUsers = [...onlineUsers, ...offlineUsers].filter(u => u.uid !== postAuthorId);
    const seen: PresenceUser[] = [];
    const unseen: PresenceUser[] = [];

    const seenUids = new Set(seenBy || []);
    
    allUsers.forEach(u => {
      if (seenUids.has(u.uid)) seen.push(u);
      else unseen.push(u);
    });

    seen.sort((a, b) => {
      if (a.online === b.online) return a.displayName.localeCompare(b.displayName);
      return a.online ? -1 : 1;
    });

    unseen.sort((a, b) => {
      if (a.online === b.online) return a.displayName.localeCompare(b.displayName);
      return a.online ? -1 : 1;
    });

    return {
      seenMembers: seen,
      unseenMembers: unseen,
      seenCount: seen.length,
      unseenCount: unseen.length,
    };
  }, [onlineUsers, offlineUsers, seenBy, postAuthorId]);

  const renderMember = (u: PresenceUser, isSeen: boolean) => {
    return (
      <div 
        key={u.uid}
        className="flex items-center gap-3 px-4 py-2.5 border-b border-border-subtle hover:bg-elevated transition-colors last:border-b-0"
      >
        <div className="relative">
          <div 
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
            style={{ 
              background: u.avatarUrl ? undefined : u.avatarColor || getAvatarColor(u.displayName),
              filter: isSeen ? 'none' : 'grayscale(1) opacity(0.5)'
            }}
          >
            {u.avatarUrl ? (
               <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
               u.displayName.charAt(0).toUpperCase()
            )}
          </div>
          {isSeen && u.online && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-surface"></div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <span className={`font-medium text-sm truncate ${isSeen ? 'text-main' : 'text-muted'}`}>
            {u.displayName}
          </span>
          {isSeen && (
            <span className="text-xs text-faint">
              {u.online ? 'Online now' : 'Offline'}
            </span>
          )}
        </div>
        {isSeen ? (
          <CheckCircle size={16} className="text-success shrink-0" />
        ) : (
          <Clock size={16} className="text-faint shrink-0" />
        )}
      </div>
    );
  };

  const modalContent = (
    <div 
      className="flex flex-col h-full bg-surface w-full overflow-hidden relative"
      style={!isMobile ? { borderRadius: '16px', border: '1px solid var(--color-border-subtle)', maxWidth: '380px', margin: 'auto', maxHeight: '80vh' } : undefined}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-primary" />
          <span className="font-semibold text-base text-main">Seen by</span>
          <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-xs font-bold">
            {seenCount}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-elevated text-muted hover:text-main transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-elevated mx-4 mt-3 mb-1 rounded-xl px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex flex-col items-start">
          <span className="font-heading font-bold text-xl text-main leading-tight">{seenCount}</span>
          <span className="text-faint text-xs">members seen</span>
        </div>
        <div className="border-r border-border-subtle h-8"></div>
        <div className="flex flex-col items-end">
          {unseenCount <= 0 ? (
            <>
              <span className="font-heading font-bold text-xl text-success leading-tight">✓</span>
              <span className="text-success text-xs font-medium">everyone's seen it</span>
            </>
          ) : (
            <>
              <span className="font-heading font-bold text-xl text-main leading-tight">{unseenCount}</span>
              <span className="text-faint text-xs">haven't seen it</span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col" style={{ maxHeight: isMobile ? undefined : '280px' }}>
        {seenCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <EyeOff size={32} className="text-muted mb-2" />
            <span className="text-muted text-sm text-center">No one has seen this yet.</span>
            <span className="text-faint text-xs text-center mt-1">Views are tracked after 1 second of reading.</span>
          </div>
        ) : (
          <>
            <div className="text-faint text-xs uppercase tracking-wide px-4 pt-3 pb-1 font-semibold">
              Seen
            </div>
            {seenMembers.map(u => renderMember(u, true))}

            {unseenCount > 0 && (
              <>
                <div className="text-faint text-xs uppercase tracking-wide px-4 pt-4 pb-1 font-semibold">
                  Haven't Seen It
                </div>
                {unseenMembers.map(u => renderMember(u, false))}
              </>
            )}
          </>
        )}
      </div>

      <div className="text-center py-3 border-t border-border-subtle shrink-0">
        <span className="text-faint text-xs">Views are counted after reading for 1 second</span>
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
      <div className="relative z-10 w-full max-w-[380px]">
        {modalContent}
      </div>
    </div>
  );
};
