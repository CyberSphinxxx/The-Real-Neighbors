import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { updateDoc, deleteDoc } from '../../lib/firestore';
import type { Event } from '../../types';
import { Calendar, Palmtree, Gamepad2, Plane, Monitor, MessageSquare, Trash2, CheckCircle2, HelpCircle, XCircle, Edit2, Star } from 'lucide-react';
import { EventNotes } from './EventNotes';
import { CreateEventModal } from './CreateEventModal';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface Props {
  event: Event;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  hangout: <Palmtree size={16} />,
  gaming: <Gamepad2 size={16} />,
  trip: <Plane size={16} />,
  online: <Monitor size={16} />,
};

const TYPE_COLORS: Record<string, string> = {
  hangout: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  gaming: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  trip: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  online: 'text-green-500 bg-green-500/10 border-green-500/20',
};

export const EventCard: React.FC<Props> = ({ event }) => {
  const { user } = useAuthStore();
  const [showNotes, setShowNotes] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const canEdit = user?.role === 'admin' || user?.id === event.createdBy;

  const handleRSVP = async (status: 'going' | 'maybe' | 'cant') => {
    if (!user) return;
    
    // Toggle logic: if clicking the current status, remove it.
    const currentStatus = event.rsvps[user.id];
    const newRsvps = { ...event.rsvps };
    
    if (currentStatus === status) {
      delete newRsvps[user.id];
    } else {
      newRsvps[user.id] = status;
    }

    try {
      await updateDoc('events', [event.id], { rsvps: newRsvps });
    } catch (error) {
      console.error(error);
      toast.error('Failed to update RSVP');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc('events', event.id);
        toast.success('Event deleted');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete event');
      }
    }
  };

  const myRsvp = user ? event.rsvps[user.id] : undefined;
  
  const counts = {
    going: Object.values(event.rsvps).filter(v => v === 'going').length,
    maybe: Object.values(event.rsvps).filter(v => v === 'maybe').length,
    cant: Object.values(event.rsvps).filter(v => v === 'cant').length,
  };

  const eventTime = typeof event.date === 'string' ? new Date(event.date).getTime() : typeof event.date === 'number' ? event.date : 0;
  
  const dateObj = new Date(eventTime);
  const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
  const timeStr = dateObj.getHours() === 12 && dateObj.getMinutes() === 0 ? '' : dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const isCustomType = !['hangout', 'gaming', 'trip', 'online'].includes(event.type);
  const badgeColor = isCustomType ? 'text-primary bg-primary/10 border-primary/20' : TYPE_COLORS[event.type];
  const badgeIcon = isCustomType ? <Star size={16} /> : TYPE_ICONS[event.type];

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${badgeColor}`}>
          {badgeIcon} {event.type}
        </span>
        {canEdit && (
          <div className="flex items-center gap-1">
            <button onClick={() => setShowEdit(true)} className="text-muted hover:text-primary p-1.5 rounded-full hover:bg-primary/10 transition-colors">
              <Edit2 size={16} />
            </button>
            <button onClick={handleDelete} className="text-muted hover:text-danger p-1.5 rounded-full hover:bg-danger/10 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <h3 className="text-xl font-heading font-bold text-main mb-2 hover:text-primary transition-colors w-fit">
        <Link to={`/events/${event.id}`}>{event.title}</Link>
      </h3>
      
      <div className="flex items-center gap-2 text-sm text-muted mb-4 font-medium">
        <Calendar size={16} />
        <span>{dateStr} {timeStr && `• ${timeStr}`}</span>
      </div>

      {event.description && (
        <p className="text-main mb-6 whitespace-pre-wrap">{event.description}</p>
      )}

      {/* RSVP Section */}
      <div className="bg-base border border-border-subtle rounded-xl p-4 mb-4">
        <p className="text-xs font-semibold text-muted mb-3 uppercase tracking-wider">Your RSVP</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button 
            onClick={() => handleRSVP('going')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${myRsvp === 'going' ? 'bg-success/20 text-success border border-success/30 ring-1 ring-success' : 'bg-surface text-muted border border-border-subtle hover:border-success/50 hover:text-success'}`}
          >
            <CheckCircle2 size={16} /> <span className="hidden sm:inline">Going</span>
          </button>
          <button 
            onClick={() => handleRSVP('maybe')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${myRsvp === 'maybe' ? 'bg-warning/20 text-warning border border-warning/30 ring-1 ring-warning' : 'bg-surface text-muted border border-border-subtle hover:border-warning/50 hover:text-warning'}`}
          >
            <HelpCircle size={16} /> <span className="hidden sm:inline">Maybe</span>
          </button>
          <button 
            onClick={() => handleRSVP('cant')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${myRsvp === 'cant' ? 'bg-danger/20 text-danger border border-danger/30 ring-1 ring-danger' : 'bg-surface text-muted border border-border-subtle hover:border-danger/50 hover:text-danger'}`}
          >
            <XCircle size={16} /> <span className="hidden sm:inline">Can't Go</span>
          </button>
        </div>
        
        <div className="flex items-center gap-4 mt-3 text-xs text-muted font-medium px-1">
          {counts.going > 0 && <span>{counts.going} going</span>}
          {counts.going > 0 && (counts.maybe > 0 || counts.cant > 0) && <span className="text-faint">•</span>}
          {counts.maybe > 0 && <span>{counts.maybe} maybe</span>}
          {counts.maybe > 0 && counts.cant > 0 && <span className="text-faint">•</span>}
          {counts.cant > 0 && <span>{counts.cant} can't go</span>}
          {counts.going === 0 && counts.maybe === 0 && counts.cant === 0 && <span>No RSVPs yet</span>}
        </div>
      </div>

      <button 
        onClick={() => setShowNotes(!showNotes)}
        className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
      >
        <MessageSquare size={16} /> 
        {showNotes ? 'Hide Notes' : 'Planning Notes'}
      </button>

      {showNotes && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <EventNotes eventId={event.id} />
        </div>
      )}

      {showEdit && (
        <CreateEventModal eventToEdit={event} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
};
