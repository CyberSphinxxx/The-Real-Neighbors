import { useLinksStore } from '../../stores/linksStore';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { addDoc, updateDoc } from '../../lib/firestore';
import type { YoutubeQueueItem } from '../../types';
import { X, PlaySquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { MobileBottomSheet } from '../ui/MobileBottomSheet';

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
    const videoId = extractVideoId(url);
    if (!videoId || !user) return;

    setIsFetching(true);
    try {
      const finalTitle = previewData?.title || 'Loading video details...';
      const finalThumbnail = previewData?.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const payload: Partial<YoutubeQueueItem> = {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoId: videoId,
        title: finalTitle,
        thumbnailUrl: finalThumbnail,
        addedBy: user.id,
        createdAt: Date.now(),
      };

      const docId = await addDoc('youtubeQueue', payload as Omit<YoutubeQueueItem, 'id'>);
      useLinksStore.getState().invalidate();
      toast.success('Added to queue!');
      onClose();

      // Fire off background fetch to update title if we didn't have it yet!
      if (!previewData) {
        fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
          .then(res => res.json())
          .then(data => {
            if (!data.error && data.title) {
              updateDoc('youtubeQueue', [docId], {
                title: data.title,
                thumbnailUrl: data.thumbnail_url || finalThumbnail
              });
            }
          })
          .catch(console.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add video');
    } finally {
      setIsFetching(false);
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const modalContent = (
    <>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-subtle bg-surface shrink-0">
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
              <img loading="lazy" decoding="async" src={previewData.thumbnailUrl} alt="" className="w-24 aspect-video object-cover rounded bg-base" />
              <div className="flex-1 min-w-0 pt-1">
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Preview</div>
                <div className="font-semibold text-main line-clamp-2 leading-tight">{previewData.title}</div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border-subtle shrink-0">
            <button
              type="submit"
              disabled={!extractVideoId(url) || isFetching}
              className="w-full flex items-center justify-center gap-2 bg-[#ff0000] hover:bg-[#cc0000] text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Add Video
            </button>
          </div>
        </form>
    </>
  );

  return isMobile ? (
    <MobileBottomSheet isOpen={true} onClose={onClose} maxHeight="90vh">
      <div className="flex flex-col h-full w-full bg-base overflow-hidden relative" style={{ minHeight: '60vh' }}>
        {modalContent}
      </div>
    </MobileBottomSheet>
  ) : (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-base border border-border-subtle rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {modalContent}
      </div>
    </div>
  );
};
