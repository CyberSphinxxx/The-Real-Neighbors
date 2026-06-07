import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface ShareToFeedModalProps {
  gameId: string;
  scoreDisplay: string;
  resultCard: React.ReactNode;
  shareText: string;
  onClose: () => void;
  onShare: () => void;
}

export const ShareToFeedModal: React.FC<ShareToFeedModalProps> = ({
  resultCard,
  shareText: initialShareText,
  onClose,
  onShare
}) => {
  const [shareText, setShareText] = useState(initialShareText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleShare = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        content: shareText,
        authorId: user.id,
        createdAt: serverTimestamp(),
        vibeTag: { emoji: '🎮', label: 'Gaming', color: '#3b82f6' },
        likes: [],
        commentsCount: 0
      });
      
      toast.success('Posted to feed! 🎮');
      onShare();
      onClose();
    } catch (error) {
      console.error('Error sharing to feed:', error);
      toast.error('Failed to post. Try again!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-surface rounded-2xl border border-border-subtle shadow-lg w-full max-w-[400px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border-subtle">
          <h2 className="font-semibold text-lg text-main">🎮 Share your result?</h2>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-elevated rounded-xl p-4 flex justify-center border border-border-subtle">
            {resultCard}
          </div>

          <div>
            <textarea
              className="w-full bg-elevated rounded-xl border border-border-subtle px-4 py-3 text-sm text-main placeholder:text-muted focus:outline-none focus:border-primary resize-none custom-scrollbar"
              rows={3}
              value={shareText}
              onChange={(e) => setShareText(e.target.value.slice(0, 300))}
              placeholder="Add a comment to your result..."
            />
            <div className="text-right mt-1 text-xs text-faint">
              {shareText.length}/300
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 flex gap-2">
          <button 
            className="flex-1 py-2.5 rounded-full border border-border-subtle text-muted hover:text-main hover:bg-elevated transition-colors font-medium text-sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Skip
          </button>
          <button 
            className="flex-1 bg-primary text-on-primary rounded-full py-2.5 font-medium text-sm hover:brightness-110 transition-all disabled:opacity-50"
            onClick={handleShare}
            disabled={isSubmitting || shareText.trim().length === 0}
          >
            {isSubmitting ? 'Posting...' : 'Post to Feed 🎮'}
          </button>
        </div>
      </div>
    </div>
  );
};
