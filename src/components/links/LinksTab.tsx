import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { deleteDoc, updateDoc } from '../../lib/firestore';
import { useUsers } from '../../hooks/useUsers';
import { useLinksStore } from '../../stores/linksStore';
const CACHE_TTL = 2 * 60 * 1000;
import type { SavedLink } from '../../types';
import { LinkCard } from './LinkCard';
import { Select } from '../ui/Select';
import { SaveLinkModal } from './SaveLinkModal';
import { LinkSkeleton } from './LinkSkeleton';
import { Plus, Filter, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../contexts/ConfirmContext';

export const LinksTab: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { links, fetchedAt, setLinks } = useLinksStore();
  const { users } = useUsers();
  const [isLoading, setIsLoading] = useState(true);
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'upvoted'>('recent');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      if (fetchedAt && Date.now() - fetchedAt < CACHE_TTL) {
        setIsLoading(false);
        return;
      }
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        const snap = await getDocs(collection(db, 'links'));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedLink));
        setLinks(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch links', err);
        setIsLoading(false);
      }
    };
    fetchLinks();
  }, []);

  const usersMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => map[u.id] = u.displayName);
    return map;
  }, [users]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    links.forEach(l => l.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [links]);

  const sortedAndFilteredLinks = useMemo(() => {
    let result = [...links];

    // Filter
    if (selectedTag) {
      result = result.filter(l => l.tags?.includes(selectedTag));
    }

    // Sort
    if (sortBy === 'recent') {
      result.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    } else {
      result.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
    }

    return result;
  }, [links, sortBy, selectedTag]);

  const { confirm } = useConfirm();

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Link',
      message: 'Are you sure you want to delete this link?',
      isDanger: true,
      confirmText: 'Delete'
    });

    if (isConfirmed) {
      try {
        await deleteDoc('links', id);
        useLinksStore.getState().invalidate();
        toast.success('Link deleted');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete');
      }
    }
  };

  const handleUpvote = async (id: string, currentlyUpvoted: boolean) => {
    if (!currentUser) return;
    
    try {
      const link = links.find(l => l.id === id);
      if (!link) return;

      const newVotes = currentlyUpvoted 
        ? (link.votes || []).filter(v => v !== currentUser.id)
        : [...(link.votes || []), currentUser.id];

      await updateDoc('links', [id], { votes: newVotes });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update vote');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Controls skeleton */}
        <div className="h-10 bg-border-subtle rounded-xl w-full animate-pulse opacity-50" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <LinkSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Filter size={16} className="text-muted" />
            <div className="flex items-center gap-2">
              <Select
                value={selectedTag || ''}
                onChange={(val) => setSelectedTag(val || null)}
                options={[
                  { value: '', label: 'All Tags' },
                  ...allTags.map(t => ({ value: t, label: t }))
                ]}
                className="bg-surface border border-border-subtle rounded-lg text-main focus-within:border-primary w-[120px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <ArrowUpDown size={16} className="text-muted" />
            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onChange={(val) => setSortBy(val as any)}
                options={[
                  { value: 'recent', label: 'Most Recent' },
                  { value: 'upvoted', label: 'Most Upvoted' }
                ]}
                className="bg-surface border border-border-subtle rounded-lg text-main focus-within:border-primary w-[140px]"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
        >
          <Plus size={18} /> Save Link
        </button>
      </div>

      {/* Grid */}
      {sortedAndFilteredLinks.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-border-subtle rounded-2xl">
          <p className="text-muted mb-4">No links found.</p>
          <button 
            onClick={() => setShowSaveModal(true)}
            className="text-primary font-bold hover:underline"
          >
            Be the first to share!
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedAndFilteredLinks.map(link => (
            <LinkCard
              key={link.id}
              link={link}
              usersMap={usersMap}
              onDelete={handleDelete}
              onUpvote={handleUpvote}
            />
          ))}
        </div>
      )}

      {showSaveModal && (
        <SaveLinkModal onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
};
