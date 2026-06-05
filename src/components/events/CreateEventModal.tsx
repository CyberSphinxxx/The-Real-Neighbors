import { useEventsStore } from '../../stores/eventsStore';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, updateDoc as firestoreUpdateDoc } from 'firebase/firestore';
import { X, Calendar, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Event } from '../../types';
import { DateTimePicker } from './DateTimePicker';

interface Props {
  onClose: () => void;
  eventToEdit?: Event;
  prefillEvent?: Partial<Event>;
}

export const CreateEventModal: React.FC<Props> = ({ onClose, eventToEdit, prefillEvent }) => {
  const { user } = useAuthStore();
  const [title, setTitle] = useState(eventToEdit?.title || prefillEvent?.title || '');
  const initialType = eventToEdit?.type || prefillEvent?.type || 'hangout';
  const [type, setType] = useState<string>(initialType);
  const [customType, setCustomType] = useState(
    !['hangout', 'gaming', 'trip', 'online'].includes(initialType) ? initialType : ''
  );
  
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  
  const [description, setDescription] = useState(eventToEdit?.description || prefillEvent?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      const eventTime = typeof eventToEdit.date === 'string' ? new Date(eventToEdit.date).getTime() : typeof eventToEdit.date === 'number' ? eventToEdit.date : 0;
      const d = new Date(eventTime);
      setDateStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      // if time wasn't strictly 00:00 or exactly noon (noon is our default)
      if (!(d.getHours() === 12 && d.getMinutes() === 0)) {
        setTimeStr(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      }
    }
  }, [eventToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateStr || !user) return;

    setIsSubmitting(true);
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      if (timeStr) {
        const [hours, mins] = timeStr.split(':').map(Number);
        dateObj.setHours(hours, mins, 0, 0);
      } else {
        dateObj.setHours(12, 0, 0, 0);
      }

      const finalType = type === 'custom' ? (customType.trim() || 'event') : type;

      const eventData = {
        title: title.trim(),
        type: finalType,
        date: dateObj.getTime(),
        description: description.trim(),
      };

      if (eventToEdit) {
        await firestoreUpdateDoc(doc(db, 'events', eventToEdit.id), eventData);
        useEventsStore.getState().invalidate();
        toast.success('Event updated successfully!');
      } else {
        const newEvent: Omit<Event, 'id'> = {
          ...eventData,
          rsvps: {},
          createdBy: user.id,
          createdAt: Date.now(),
        };
        await addDoc(collection(db, 'events'), newEvent);
        
        import('../../lib/notifications').then(({ broadcastNotification }) => {
          broadcastNotification({
            type: 'event',
            fromUid: user.id,
            fromName: user.displayName,
            fromAvatarColor: user.accentColor || '#3b82f6',
            message: `${user.displayName} created a new event: ${title.trim()}`,
            preview: `${dateObj.toLocaleDateString()} · ${finalType}`,
          }, 'events');
        });

        useEventsStore.getState().invalidate();
        toast.success('Event created successfully!');
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(eventToEdit ? 'Failed to update event' : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-base rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border-subtle overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-surface">
          <h2 className="text-xl font-heading font-bold text-main flex items-center gap-2">
            <Calendar className="text-primary" /> {eventToEdit ? 'Edit Event' : 'Create Event'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full text-muted hover:bg-base hover:text-main transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-main mb-1">Event Title *</label>
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Movie Night at my place"
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-main mb-1">Date & Time *</label>
            <DateTimePicker 
              dateValue={dateStr}
              timeValue={timeStr}
              onDateChange={setDateStr}
              onTimeChange={setTimeStr}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-main mb-1">Type</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(['hangout', 'gaming', 'trip', 'online', 'custom'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-1.5 px-3 rounded-lg text-sm font-medium border transition-all capitalize ${
                    (type === t || (t === 'custom' && !['hangout', 'gaming', 'trip', 'online'].includes(type)))
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-surface border-border-subtle text-muted hover:border-border'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {(type === 'custom' || !['hangout', 'gaming', 'trip', 'online'].includes(type)) && (
              <input 
                type="text"
                required
                value={customType}
                onChange={(e) => { setCustomType(e.target.value); setType('custom'); }}
                placeholder="Custom type (e.g., Party)"
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-main mb-1">Description (Optional)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some details..."
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none h-24"
            />
          </div>

          <div className="pt-4 mt-2 border-t border-border-subtle">
            <button 
              type="submit"
              disabled={isSubmitting || !title || !dateStr}
              className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> {eventToEdit ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                eventToEdit ? 'Save Changes' : 'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
