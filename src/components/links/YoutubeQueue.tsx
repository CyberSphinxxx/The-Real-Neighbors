import React, { useState } from 'react';
import type { YoutubeQueueItem } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { deleteDoc, updateDoc } from '../../lib/firestore';
import { Trash2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  queue: YoutubeQueueItem[];
  usersMap: Record<string, string>;
}

export const YoutubeQueue: React.FC<Props> = ({ queue, usersMap }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDelete = async (item: YoutubeQueueItem) => {
    if (user?.id !== item.addedBy && !isAdmin) return;
    try {
      await deleteDoc('youtubeQueue', item.id);
      toast.success('Removed from queue');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove');
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isAdmin) return;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    if (!isAdmin || !draggedId || draggedId === targetId) return;
    e.preventDefault();

    const draggedIndex = queue.findIndex(q => q.id === draggedId);
    const targetIndex = queue.findIndex(q => q.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    // A simple reorder logic: we adjust the createdAt timestamp to sit between neighbors.
    // To be perfectly precise, we'd need an explicit `order` float field, but createdAt can act as one.
    
    let newTime = 0;
    
    if (targetIndex === 0 && draggedIndex > 0) {
      // Moving to top
      newTime = queue[0].createdAt - 1000;
    } else if (targetIndex === queue.length - 1 && draggedIndex < targetIndex) {
      // Moving to bottom
      newTime = queue[queue.length - 1].createdAt + 1000;
    } else {
      // Moving between items
      const before = targetIndex > draggedIndex ? queue[targetIndex] : queue[targetIndex - 1];
      const after = targetIndex > draggedIndex ? queue[targetIndex + 1] : queue[targetIndex];
      
      if (!before) newTime = after.createdAt - 1000;
      else if (!after) newTime = before.createdAt + 1000;
      else newTime = (before.createdAt + after.createdAt) / 2;
    }

    try {
      await updateDoc('youtubeQueue', [draggedId], { createdAt: newTime });
    } catch (err) {
      console.error(err);
      toast.error('Failed to reorder');
    }
    setDraggedId(null);
  };

  // The first item is currently playing, so we can slice(1) to show "Up Next"
  const upNext = queue.slice(1);

  if (upNext.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="font-heading font-bold text-main mb-4">Up Next ({upNext.length})</h3>
      
      <div className="flex flex-col gap-2">
        {upNext.map((item, index) => {
          const canDelete = user?.id === item.addedBy || isAdmin;
          
          return (
            <div 
              key={item.id}
              draggable={isAdmin}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                draggedId === item.id ? 'opacity-50 border-primary bg-primary/5' : 'bg-surface border-border-subtle hover:border-border'
              }`}
            >
              {isAdmin && (
                <div className="px-1 text-border-subtle cursor-grab active:cursor-grabbing hover:text-muted transition-colors">
                  <GripVertical size={20} />
                </div>
              )}
              
              {!isAdmin && (
                <div className="w-8 text-center text-xs font-bold text-muted">
                  {index + 2}
                </div>
              )}

              <img src={item.thumbnailUrl} alt="" className="w-16 h-9 object-cover rounded bg-base" />
              
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-main line-clamp-1">{item.title}</div>
                <div className="text-[10px] text-muted">Added by {usersMap[item.addedBy] || 'Unknown'}</div>
              </div>

              {canDelete && (
                <button 
                  onClick={() => handleDelete(item)}
                  className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors mr-1"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
