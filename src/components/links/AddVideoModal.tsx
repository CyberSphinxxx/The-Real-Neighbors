import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { addDoc } from '../../lib/firestore';
import type { YoutubeQueueItem } from '../../types';
import { X, PlaySquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
}

export const AddVideoModal: React.FC<Props> = ({ onClose }) => {
  const { user } = useAuthStore();
  const [url, setUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  
  // Preview state
  const [previewData, setPreviewData] = useState<{ title: string, thumbnailUrl: string, videoId: string } | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const extractVideoId = (input: string) => {
    const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (!url.trim()) {
      setPreviewData(null);
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      setPreviewData(null);
      return;
    }

    const delay = setTimeout(async () => {
      setIsFetching(true);
      try {
        // Use noembed proxy to bypass CORS issues with direct oembed
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        const data = await res.json();
        
        if (data.error) {
          toast.error("Could not fetch video details");
          setPreviewData(null);
        } else {
          setPreviewData({
            videoId,
            title: data.title,
            thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          });
        }
      } catch (err) {
        console.error(err);
        // Fallback if oembed fails
        setPreviewData({
          videoId,
          title: 'Unknown YouTube Video',
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        });
      } finally {
        setIsFetching(false);
      }
    }, 800);

    return () => clearTimeout(delay);
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewData || !user) return;

    setIsFetching(true);
    try {
      const payload: Partial<YoutubeQueueItem> = {
        url: `https://www.youtube.com/watch?v=${previewData.videoId}`,
        videoId: previewData.videoId,
        title: previewData.title,
        thumbnailUrl: previewData.thumbnailUrl,
        addedBy: user.id,
        createdAt: Date.now(),
      };

      await addDoc('youtubeQueue', payload as any);
      toast.success('Added to queue!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add video');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-base border border-border-subtle rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-subtle bg-surface">
          <h2 className="text-xl font-heading font-bold text-main flex items-center gap-2">
            <PlaySquare className="text-[#ff0000]" /> Add to Queue
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-base text-muted hover:text-main transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-main mb-1.5">
              YouTube URL *
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted"
            />
          </div>

          {isFetching && (
            <div className="flex items-center justify-center py-4 text-muted">
              <Loader2 className="animate-spin" size={24} />
            </div>
          )}

          {previewData && !isFetching && (
            <div className="animate-in fade-in slide-in-from-bottom-2 bg-surface border border-border-subtle rounded-xl p-3 flex items-start gap-3">
              <img src={previewData.thumbnailUrl} alt="" className="w-24 aspect-video object-cover rounded bg-base" />
              <div className="flex-1 min-w-0 pt-1">
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Preview</div>
                <div className="font-semibold text-main line-clamp-2 leading-tight">{previewData.title}</div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border-subtle">
            <button
              type="submit"
              disabled={!previewData || isFetching}
              className="w-full flex items-center justify-center gap-2 bg-[#ff0000] hover:bg-[#cc0000] text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Add Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
