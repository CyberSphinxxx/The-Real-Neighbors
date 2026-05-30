import React from 'react';
import type { YoutubeQueueItem } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { deleteDoc } from '../../lib/firestore';
import { SkipForward } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  currentVideo: YoutubeQueueItem | undefined;
}

export const YoutubePlayer: React.FC<Props> = ({ currentVideo }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const handleNext = async () => {
    if (!currentVideo) return;
    try {
      await deleteDoc('youtubeQueue', currentVideo.id);
      toast.success('Skipped to next video');
    } catch (err) {
      console.error(err);
      toast.error('Failed to skip video');
    }
  };

  if (!currentVideo) {
    return (
      <div className="w-full aspect-video bg-base border border-border-subtle rounded-xl flex items-center justify-center text-muted">
        <p>Queue is empty. Add something to watch! 📺</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 16:9 Responsive Container */}
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-md">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=0`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>

      <div className="flex items-start justify-between gap-4 p-4 bg-surface border border-border-subtle rounded-xl shadow-sm">
        <div className="min-w-0">
          <h2 className="font-bold text-lg text-main line-clamp-2 leading-tight">
            {currentVideo.title}
          </h2>
        </div>

        {isAdmin && (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-base hover:bg-border-subtle border border-border-subtle rounded-lg text-main font-semibold transition-colors flex-shrink-0"
          >
            Next <SkipForward size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
