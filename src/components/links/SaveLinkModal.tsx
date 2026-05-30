import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { addDoc } from '../../lib/firestore';
import type { SavedLink } from '../../types';
import { X, Link as LinkIcon, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
}

export const SaveLinkModal: React.FC<Props> = ({ onClose }) => {
  const { user } = useAuthStore();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Debounced URL fetch
  useEffect(() => {
    if (!url.trim() || !url.startsWith('http')) return;

    const delay = setTimeout(async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          if (!title) setTitle(json.data.title || '');
          if (!description) setDescription(json.data.description || '');
        }
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      } finally {
        setIsFetching(false);
      }
    }, 1000);

    return () => clearTimeout(delay);
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const tagsArray = tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
      
      const payload: Partial<SavedLink> = {
        url: url.trim(),
        title: title.trim(),
        tags: tagsArray,
        savedBy: user.id,
        votes: [], // initial 0 votes
        createdAt: Date.now(),
      };

      if (description.trim()) {
        payload.description = description.trim();
      }

      await addDoc('links', payload as any);
      toast.success('Link saved successfully!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-base border border-border-subtle rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-subtle bg-surface">
          <h2 className="text-xl font-heading font-bold text-main flex items-center gap-2">
            <LinkIcon className="text-primary" /> Save a Link
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-base text-muted hover:text-main transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* URL */}
          <div>
            <label className="block text-sm font-semibold text-main mb-1.5">
              URL *
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-primary font-semibold h-4">
            {isFetching && (
              <>
                <Loader2 size={12} className="animate-spin" /> Auto-fetching details...
              </>
            )}
            {!isFetching && title && (
              <>
                <Sparkles size={12} /> Details loaded
              </>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-main mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give it a title"
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-main mb-1.5">
              Description <span className="text-muted font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this about?"
              rows={3}
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-main mb-1.5">
              Tags <span className="text-muted font-normal">(Comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g., news, funny, tech"
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted"
            />
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <button
              type="submit"
              disabled={!url.trim() || !title.trim() || isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              Save Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
