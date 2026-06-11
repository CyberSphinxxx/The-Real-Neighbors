import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, MessageSquare, Gamepad2, Bot, Calendar, 
  Tv, Music2 as Music2Icon, Link as LinkIcon, 
  Cake, UserCircle, Settings, LogOut 
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [startX, setStartX] = useState<number | null>(null);
  
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    // If swiped left by more than 60px
    if (diff > 60) {
      onClose();
      setStartX(null);
    }
  };

  const handleTouchEnd = () => {
    setStartX(null);
  };

  if (!user) return null;

  const handleSignOut = async () => {
    await logout();
    onClose();
  };

  const sections = [
    {
      title: 'MAIN',
      items: [
        { name: 'Feed', path: '/', icon: Home },
        { name: 'Chat', path: '/chat', icon: MessageSquare },
        { name: 'Games', path: '/games', icon: Gamepad2 },
        { name: 'Botbot', path: '/ai', icon: Bot },
        { name: 'Events', path: '/events', icon: Calendar },
      ]
    },
    {
      title: 'DISCOVER',
      items: [
        { name: 'Watchlist', path: '/watchlist', icon: Tv },
        { name: 'Playlist', path: '/playlist', icon: Music2Icon },
        { name: 'Links', path: '/links', icon: LinkIcon },
      ]
    },
    {
      title: 'SOCIAL',
      items: [
        { name: 'Birthdays', path: '/birthdays', icon: Cake },
        { name: 'Profile', path: `/profile/${user.handle || user.id}`, icon: UserCircle },
      ]
    },
    {
      title: 'APP',
      items: [
        { name: 'Settings', path: '/settings', icon: Settings },
        // Notifications is just settings with a tab, we can link to /settings directly
      ]
    }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-[100] md:hidden"
          style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 250ms' }}
        />
      )}

      {/* Drawer */}
      <nav 
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-surface border-r border-border-subtle z-[101] flex flex-col transform transition-transform duration-250 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* User Card */}
        <div 
          className="p-4 border-b border-border-subtle flex items-center gap-3 cursor-pointer hover:bg-elevated transition-colors"
          onClick={() => {
            navigate(`/profile/${user.handle || user.id}`);
            onClose();
          }}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              user.displayName?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-main truncate leading-tight">
              {user.displayName}
            </p>
            <p className="text-xs text-muted truncate">
              {user.role === 'admin' ? 'Admin' : 'Neighbor'}
            </p>
          </div>
        </div>

        {/* Nav Sections */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {sections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? "mt-4" : ""}>
              <h3 className="text-xs font-semibold text-faint uppercase tracking-wide px-4 mb-2">
                {section.title}
              </h3>
              <nav className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 w-full transition-all duration-150 py-3 pr-4 pl-4 ${
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted font-medium hover:bg-elevated hover:text-main'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-1" 
                            style={{ 
                              background: 'var(--color-primary)',
                              borderRadius: '0 2px 2px 0' 
                            }} 
                          />
                        )}
                        <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2 : 1.8} />
                        <span className="text-sm">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border-subtle bg-surface mt-auto">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-danger hover:text-danger-hover transition-colors w-full p-2"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
          <div className="text-faint text-xs text-center mt-4">
            v1.0.0
          </div>
        </div>
      </nav>
    </>
  );
};
