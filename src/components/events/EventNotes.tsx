import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { db } from '../../lib/firebase';
import { getDoc } from '../../lib/firestore';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Send, Loader2 } from 'lucide-react';
import type { EventNote, User } from '../../types';

interface Props {
  eventId: string;
}

const NoteItem: React.FC<{ note: EventNote }> = ({ note }) => {
  const [author, setAuthor] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;
    getDoc<User>('users', [note.authorId]).then(u => {
      if (isMounted) setAuthor(u);
    });
    return () => { isMounted = false; };
  }, [note.authorId]);

  return (
    <div className="flex gap-3 text-sm">
      <div className="w-6 h-6 rounded-full bg-border text-muted flex items-center justify-center font-bold flex-shrink-0 text-[10px]">
        {author ? author.displayName.charAt(0).toUpperCase() : '?'}
      </div>
      <div className="flex-1 bg-base rounded-lg rounded-tl-none p-2 border border-border-subtle shadow-sm">
        <div className="flex items-center justify-between mb-0.5">
          <p className="font-semibold text-main text-xs">{author ? author.displayName : 'Loading...'}</p>
          <span className="text-[10px] text-faint">
            {new Date(note.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-main text-xs break-words whitespace-pre-wrap">{note.content}</p>
      </div>
    </div>
  );
};

export const EventNotes: React.FC<Props> = ({ eventId }) => {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<EventNote[]>([]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'events', eventId, 'notes'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventNote));
      setNotes(data);
    });

    return () => unsub();
  }, [eventId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const newNote: Omit<EventNote, 'id'> = {
        authorId: user.id,
        content: content.trim(),
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'events', eventId, 'notes'), newNote);
      setContent('');
    } catch (error) {
      console.error('Failed to post note', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
      <div className="p-3 bg-base border-b border-border-subtle flex items-center justify-between">
        <h4 className="text-xs font-semibold text-main">Planning Notes</h4>
        <span className="text-xs text-muted">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="p-3 space-y-3 max-h-48 overflow-y-auto custom-scrollbar bg-surface/50">
        {notes.length === 0 ? (
          <p className="text-xs text-faint italic text-center py-2">No notes yet. Add one to help plan!</p>
        ) : (
          notes.map(note => <NoteItem key={note.id} note={note} />)
        )}
      </div>

      <div className="p-3 bg-base border-t border-border-subtle flex gap-2 items-end">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note (e.g., 'I can bring snacks')..."
          className="flex-1 bg-surface border border-border-subtle rounded-lg px-3 py-2 text-xs text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none min-h-[36px] max-h-24"
          rows={1}
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
          className="p-2 rounded-lg bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
        </button>
      </div>
    </div>
  );
};
