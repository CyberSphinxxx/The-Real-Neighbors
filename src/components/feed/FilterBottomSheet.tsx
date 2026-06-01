import React, { useEffect, useState } from 'react';
import { X, Users } from 'lucide-react';
import { getAvatarColor } from '../../utils/avatarColor';
import type { User } from '../../types';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeType: string;
  setActiveType: (t: string) => void;
  activeMember: string | null;
  setActiveMember: (m: string | null) => void;
  sortBy: 'Latest' | 'Most Reacted';
  setSortBy: (s: 'Latest' | 'Most Reacted') => void;
  users: User[];
  filterTypes: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  isOpen,
  onClose,
  activeType,
  setActiveType,
  activeMember,
  setActiveMember,
  sortBy,
  setSortBy,
  users,
  filterTypes,
  onClearFilters,
  hasActiveFilters,
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-end transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`relative w-full bg-surface rounded-t-2xl shadow-2xl transition-transform duration-300 transform ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } flex flex-col max-h-[85vh]`}
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle shrink-0">
          <h3 className="font-heading font-bold text-lg text-main">Filters</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-elevated transition-colors text-muted hover:text-main"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">
          
          {/* Post Type */}
          <div>
            <h4 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Post Type</h4>
            <div className="flex flex-wrap gap-2">
              {filterTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-4 py-2 text-sm rounded-full border transition-all active:scale-95 ${
                    activeType === type
                      ? 'bg-primary/15 border-primary text-primary font-bold shadow-sm'
                      : 'border-border text-muted bg-base hover:text-main'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <h4 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Sort By</h4>
            <div className="flex gap-2">
              {(['Latest', 'Most Reacted'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`flex-1 py-2.5 text-sm rounded-xl font-bold transition-all active:scale-95 border ${
                    sortBy === s
                      ? 'bg-primary text-on-primary border-primary shadow-md'
                      : 'border-border bg-base text-muted hover:text-main'
                  }`}
                >
                  {s === 'Latest' ? '✨ Latest' : '🔥 Most Reacted'}
                </button>
              ))}
            </div>
          </div>

          {/* Members */}
          <div>
            <h4 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Filter by Member</h4>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              <button
                onClick={() => setActiveMember(null)}
                className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    activeMember === null
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface shadow-md'
                      : 'opacity-70 group-hover:opacity-100 border border-border bg-base'
                  }`}
                >
                  <Users size={20} className={activeMember === null ? 'text-primary' : 'text-muted'} />
                </div>
                <span
                  className={`text-[10px] sm:text-xs truncate w-full text-center ${
                    activeMember === null ? 'font-bold text-main' : 'text-muted'
                  }`}
                >
                  All
                </span>
              </button>
              
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setActiveMember(u.id)}
                  className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg transition-all ${
                      activeMember === u.id
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface shadow-md'
                        : 'opacity-70 group-hover:opacity-100'
                    }`}
                    style={{ background: u.avatarUrl ? undefined : getAvatarColor(u.displayName) }}
                  >
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      u.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs truncate w-full text-center ${
                      activeMember === u.id ? 'font-bold text-main' : 'text-muted'
                    }`}
                  >
                    {u.displayName.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        {hasActiveFilters && (
          <div className="p-4 border-t border-border-subtle shrink-0">
            <button
              onClick={() => {
                onClearFilters();
                onClose();
              }}
              className="w-full py-3 bg-base border border-border hover:border-muted rounded-xl text-sm font-semibold text-main transition-colors active:scale-95"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
