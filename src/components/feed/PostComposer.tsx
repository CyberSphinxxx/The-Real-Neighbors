import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { addDoc } from '../../lib/firestore';
import { fetchLinkPreview } from '../../utils/linkPreview';
import type { LinkMetadata } from '../../utils/linkPreview';
import toast from 'react-hot-toast';
import { Link, X, Loader2 } from 'lucide-react';
import type { Post } from '../../types';

export const PostComposer: React.FC = () => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState('');
  const [linkMeta, setLinkMeta] = useState<LinkMetadata | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Debounced URL preview fetcher
  useEffect(() => {
    if (!url || !url.startsWith('http')) {
      setLinkMeta(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingPreview(true);
      const meta = await fetchLinkPreview(url);
      setLinkMeta(meta);
      setIsLoadingPreview(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !linkMeta) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      const newPost = {
        authorId: user.id,
        content: content.trim(),
        linkUrl: linkMeta ? linkMeta.url : null,
        linkMeta: linkMeta || null,
        reactions: {},
        comments: [], // Note: comments are also in subcollection, but keeping it empty here for type compatibility if needed
        isPinned: false,
        createdAt: Date.now(),
      };

      await addDoc<Omit<Post, 'id'>>('posts', newPost as any);
      
      setContent('');
      setUrl('');
      setShowUrlInput(false);
      setLinkMeta(null);
      toast.success("Posted successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLink = () => {
    setUrl('');
    setLinkMeta(null);
    setShowUrlInput(false);
  };

  return (
    <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border-subtle mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="What's on your mind?"
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-main placeholder:text-muted p-0 mt-2 min-h-[60px]"
              maxLength={500}
            />
            
            {showUrlInput && (
              <div className="mt-2 mb-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 bg-base p-2 rounded-lg border border-border">
                  <Link size={16} className="text-muted shrink-0 ml-2" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-transparent border-none text-sm text-main focus:ring-0 p-1"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="p-1 hover:bg-surface rounded-full text-muted mr-1"
                  >
                    <X size={16} />
                  </button>
                </div>

                {isLoadingPreview && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                    <Loader2 size={14} className="animate-spin" /> Fetching preview...
                  </div>
                )}

                {linkMeta && (
                  <div className="mt-3 border border-border-subtle rounded-xl overflow-hidden bg-base flex flex-col sm:flex-row">
                    {linkMeta.image && (
                      <div className="h-32 sm:h-24 sm:w-24 shrink-0 overflow-hidden bg-border-subtle">
                        <img src={linkMeta.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-3 flex flex-col justify-center min-w-0">
                      <h4 className="text-sm font-semibold text-main truncate">{linkMeta.title}</h4>
                      <p className="text-xs text-muted line-clamp-2 mt-1">{linkMeta.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className={`p-2 rounded-full hover:bg-base transition-colors ${showUrlInput || url ? 'text-primary bg-primary/5' : 'text-muted'}`}
                  title="Add Link"
                >
                  <Link size={18} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${500 - content.length <= 20 ? 'text-danger' : 'text-faint'}`}>
                  {500 - content.length}
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || (!content.trim() && !linkMeta)}
                  className="px-5 py-2 bg-primary text-on-primary font-medium text-sm rounded-full shadow-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
