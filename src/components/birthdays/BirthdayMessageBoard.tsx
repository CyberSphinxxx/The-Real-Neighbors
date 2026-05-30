import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getDoc } from '../../lib/firestore';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { User, BirthdayMessageBoard as BoardType } from '../../types';
import { Loader2, Send, PartyPopper } from 'lucide-react';

interface Props {
  celebrant: User;
}

const MessageItem: React.FC<{ authorId: string; content: string }> = ({ authorId, content }) => {
  const [author, setAuthor] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;
    getDoc<User>('users', [authorId]).then(u => {
      if (isMounted) setAuthor(u);
    });
    return () => { isMounted = false; };
  }, [authorId]);

  return (
    <div className="flex gap-3 text-sm animate-in fade-in slide-in-from-bottom-2">
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-xs">
        {author ? author.displayName.charAt(0).toUpperCase() : '?'}
      </div>
      <div className="flex-1 bg-surface rounded-2xl rounded-tl-none p-3 border border-border-subtle shadow-sm">
        <p className="font-semibold text-main mb-1">{author ? author.displayName : 'Loading...'}</p>
        <p className="text-main break-words whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

export const BirthdayMessageBoard: React.FC<Props> = ({ celebrant }) => {
  const { user: currentUser } = useAuthStore();
  const [board, setBoard] = useState<BoardType | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const boardId = `${celebrant.id}_${currentYear}`;

  useEffect(() => {
    // Note: Since subscribeToCollection expects a collection path, we need a small hack or custom listener for a single doc.
    // Let's use standard onSnapshot for a single document to be safe.
    import('firebase/firestore').then(({ onSnapshot, doc }) => {
      const unsub = onSnapshot(doc(db, 'birthdayMessages', boardId), (snapshot) => {
        if (snapshot.exists()) {
          setBoard({ id: snapshot.id, ...snapshot.data() } as BoardType);
        } else {
          setBoard(null);
        }
      });
      return () => unsub();
    });
  }, [boardId]);

  const hasSentMessage = board?.messages.some(m => m.authorId === currentUser?.id);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || !currentUser || hasSentMessage) return;

    setIsSubmitting(true);
    try {
      const newMessage = {
        authorId: currentUser.id,
        content: content.trim(),
        createdAt: Date.now()
      };

      const docRef = doc(db, 'birthdayMessages', boardId);
      await setDoc(docRef, {
        year: currentYear,
        messages: arrayUnion(newMessage)
      }, { merge: true });
      
      setContent('');
    } catch (error) {
      console.error('Failed to post birthday message', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-base to-surface border border-primary/20 shadow-sm relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-6 -right-6 text-primary/10 transform rotate-12">
        <PartyPopper size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xl shadow-md">
            {celebrant.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-main">It's {celebrant.displayName}'s Birthday! 🎂</h2>
            <p className="text-sm text-muted">Leave a message for them to read.</p>
          </div>
        </div>

        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {!board || board.messages.length === 0 ? (
            <p className="text-sm text-faint italic py-2">No messages yet. Be the first to wish them a happy birthday!</p>
          ) : (
            board.messages.map((msg, i) => (
              <MessageItem key={i} authorId={msg.authorId} content={msg.content} />
            ))
          )}
        </div>

        {currentUser?.id !== celebrant.id && (
          <div className="mt-4 pt-4 border-t border-border-subtle/50">
            {hasSentMessage ? (
              <p className="text-sm text-primary font-medium text-center py-2 bg-primary/5 rounded-lg">
                You've already wished them a happy birthday! 🎉
              </p>
            ) : (
              <div className="flex gap-3 items-end">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write a birthday message..."
                  className="flex-1 bg-base/80 backdrop-blur-sm border border-border-subtle rounded-2xl px-4 py-3 text-sm text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary resize-none min-h-[44px] max-h-32"
                  rows={content.split('\n').length > 1 ? Math.min(content.split('\n').length, 3) : 1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <button
                  onClick={() => handleSubmit()}
                  disabled={!content.trim() || isSubmitting}
                  className="mb-1 p-3 rounded-full bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
