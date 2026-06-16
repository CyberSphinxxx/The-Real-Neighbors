import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, X } from 'lucide-react';
import { subscribeToCollection } from '../../lib/firestore';
import type { Notification } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '../../utils/date';
import { orderBy, limit } from 'firebase/firestore';
import { MobileBottomSheet } from '../ui/MobileBottomSheet';
import { useConfirm } from '../../contexts/ConfirmContext';

export const NotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const { confirm } = useConfirm();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection<Notification>(
      `users/${user.id}/notifications`,
      (data) => setNotifications(data),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      const { writeBatch, doc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      const batch = writeBatch(db);
      const unread = notifications.filter(n => !n.isRead);
      unread.forEach(n => {
        batch.update(doc(db, `users/${user.id}/notifications`, n.id), { isRead: true });
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    const confirmed = await confirm({
      title: 'Clear Notifications?',
      message: 'This will mark all notifications as read.',
      confirmText: 'Clear',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    try {
      const { writeBatch, doc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, `users/${user.id}/notifications`, n.id));
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      await deleteDoc(doc(db, `users/${user.id}/notifications`, id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead && user) {
      try {
        const { updateDoc: updateFsDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        await updateFsDoc(doc(db, `users/${user.id}/notifications`, n.id), { isRead: true });
      } catch (err) {
        console.error(err);
      }
    }
    setIsOpen(false);

    if (['post', 'reaction', 'comment', 'mention', 'expiry'].includes(n.type)) {
      navigate('/');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openPostModal', { detail: n.postId }));
      }, 100);
    } else if (n.type === 'event' || n.type === 'event_reminder') {
      navigate('/events');
    } else if (n.type === 'birthday') {
      navigate('/birthdays');
    } else if (n.type === 'poll') {
      navigate('/');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('scrollToPoll'));
      }, 100);
    } else if (n.type === 'streak_risk') {
      navigate('/');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('focusComposer'));
      }, 100);
    } else if (n.type === 'release') {
      navigate('/settings', { state: { tab: 'about' } });
    }
  };

  const grouped = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    
    const res = { today: [] as Notification[], earlier: [] as Notification[] };
    notifications.forEach(n => {
      if (n.createdAt >= todayTime) res.today.push(n);
      else res.earlier.push(n);
    });
    return res;
  }, [notifications]);

  const renderItem = (n: Notification) => {
    const isSystem = ['birthday', 'streak_risk', 'expiry', 'event_reminder', 'release'].includes(n.type);
    let avatarContent = <></>;
    if (n.type === 'birthday') avatarContent = <span>🎂</span>;
    else if (n.type === 'streak_risk') avatarContent = <span>🔥</span>;
    else if (n.type === 'expiry') avatarContent = <span>⏱️</span>;
    else if (n.type === 'event_reminder') avatarContent = <span>🗓️</span>;
    else if (n.type === 'release') avatarContent = <span>🚀</span>;
    else avatarContent = <span className="text-white font-bold">{n.fromName.charAt(0).toUpperCase()}</span>;

    return (
      <div 
        key={n.id}
        onClick={() => handleNotificationClick(n)}
        className={`flex items-start px-4 py-3 gap-3 hover:bg-elevated cursor-pointer transition-colors border-l-[3px] ${
          !n.isRead 
            ? 'border-primary' 
            : 'border-transparent'
        }`}
        style={{
          background: !n.isRead ? 'color-mix(in srgb, var(--color-primary) 3%, transparent)' : 'transparent'
        }}
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm shadow-sm"
          style={{ background: isSystem ? 'var(--color-bg-elevated)' : n.fromAvatarColor }}
        >
          {avatarContent}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-main ${!n.isRead ? 'font-medium' : ''}`}>
            {n.message}
          </p>
          {n.preview && (
            <p className="text-xs text-muted mt-0.5 truncate">
              {n.preview}
            </p>
          )}
          <p className="text-xs text-faint mt-1">
            {formatTimeAgo(n.createdAt)}
          </p>
        </div>
        
        <button 
          onClick={(e) => handleDelete(e, n.id)}
          className="p-1 text-faint hover:text-main transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="relative">
      <button 
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-main transition-colors relative flex-shrink-0"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-surface shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* The Notification Panel */}
      {isMobile ? (
        <MobileBottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} maxHeight="75vh">
          <div 
            ref={panelRef}
            className="flex flex-col z-40 overflow-hidden h-full bg-surface"
            style={{ maxHeight: 'none' }}
          >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
            <h2 className="font-semibold text-base text-main">Notifications</h2>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="text-sm text-muted hover:text-main font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-[300px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center flex-1">
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-sm text-muted font-medium">You're all caught up!</p>
              </div>
            ) : (
              <>
                {grouped.today.length > 0 && (
                  <div className="flex flex-col">
                    <div className="sticky top-0 bg-surface/95 backdrop-blur-sm px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-faint font-semibold z-10 border-b border-transparent">
                      Today
                    </div>
                    {grouped.today.map(renderItem)}
                  </div>
                )}
                
                {grouped.earlier.length > 0 && (
                  <div className="flex flex-col">
                    <div className="sticky top-0 bg-surface/95 backdrop-blur-sm px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-faint font-semibold z-10 border-b border-transparent">
                      Earlier
                    </div>
                    {grouped.earlier.map(renderItem)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </MobileBottomSheet>
      ) : (
        isOpen && (
          <div 
            ref={panelRef}
            className="absolute right-0 mt-2 w-[380px] bg-surface rounded-2xl border border-border-subtle shadow-lg flex flex-col z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
            style={{ maxHeight: 'calc(100vh - 100px)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
              <h2 className="font-semibold text-base text-main">Notifications</h2>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-sm text-muted hover:text-main font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center flex-1">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="text-sm text-muted font-medium">You're all caught up!</p>
                </div>
              ) : (
                <>
                  {grouped.today.length > 0 && (
                    <div className="flex flex-col">
                      <div className="sticky top-0 bg-surface/95 backdrop-blur-sm px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-faint font-semibold z-10 border-b border-transparent">
                        Today
                      </div>
                      {grouped.today.map(renderItem)}
                    </div>
                  )}
                  
                  {grouped.earlier.length > 0 && (
                    <div className="flex flex-col">
                      <div className="sticky top-0 bg-surface/95 backdrop-blur-sm px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-faint font-semibold z-10 border-b border-transparent">
                        Earlier
                      </div>
                      {grouped.earlier.map(renderItem)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};
