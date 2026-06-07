import { useEventsStore } from '../../stores/eventsStore';
import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { updateDoc, deleteDoc } from '../../lib/firestore';
import type { Event } from '../../types';
import { Calendar, Palmtree, Gamepad2, Plane, Monitor, MessageSquare, Trash2, CheckCircle2, HelpCircle, XCircle, Edit2, Star } from 'lucide-react';
import { EventNotes } from './EventNotes';
import { CreateEventModal } from './CreateEventModal';
import toast from 'react-hot-toast';
import { useConfirm } from '../../contexts/ConfirmContext';
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
  const { onlineUsers, offlineUsers } = useOnlineUsers();
  const allUsers = [...onlineUsers, ...offlineUsers];
  
  const [optimisticEvent, setOptimisticEvent] = React.useState(event);
  React.useEffect(() => setOptimisticEvent(event), [event]);
  const [showNotes, setShowNotes] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const canEdit = user?.role === 'admin' || user?.id === optimisticEvent.createdBy;

  const handleRSVP = async (status: 'going' | 'maybe' | 'cant') => {
    if (!user) return;
    
    // Toggle logic: if clicking the current status, remove it.
    const currentStatus = optimisticEvent.rsvps[user.id];
    const newRsvps = { ...optimisticEvent.rsvps };
    
    if (currentStatus === status) {
      delete newRsvps[user.id];
    } else {
      newRsvps[user.id] = status;
    }

    try {
      setOptimisticEvent({ ...optimisticEvent, rsvps: newRsvps });
      await updateDoc('events', [event.id], { rsvps: newRsvps });
    } catch (error) {
      console.error(error);
      setOptimisticEvent(event);
      toast.error('Failed to update RSVP');
    }
  };

  const { confirm } = useConfirm();

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Cancel Event',
      message: 'Are you sure you want to cancel this event?',
      isDanger: true,
      confirmText: 'Cancel Event'
    });

    if (isConfirmed) {
      try {
        await deleteDoc('events', event.id);
        useEventsStore.getState().invalidate();
        toast.success('Event deleted');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete event');
      }
    }
  };

  const myRsvp = user ? optimisticEvent.rsvps[user.id] : undefined;
  
  const eventTime = typeof optimisticEvent.date === 'string' ? new Date(optimisticEvent.date).getTime() : typeof optimisticEvent.date === 'number' ? optimisticEvent.date : 0;
  
  const isPast = eventTime < Date.now();

  const dateObj = new Date(eventTime);
  const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
  const timeStr = dateObj.getHours() === 12 && dateObj.getMinutes() === 0 ? '' : dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const isCustomType = !['hangout', 'gaming', 'trip', 'online'].includes(optimisticEvent.type);
  const badgeColor = isCustomType ? 'text-primary bg-primary/10 border-primary/20' : TYPE_COLORS[optimisticEvent.type];
  const badgeIcon = isCustomType ? <Star size={16} /> : TYPE_ICONS[optimisticEvent.type];

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${badgeColor}`}>
          {badgeIcon} {optimisticEvent.type}
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
        <Link to={`/events/${optimisticEvent.id}`}>{optimisticEvent.title}</Link>
      </h3>
      
      <div className="flex items-center gap-2 text-sm text-muted mb-4 font-medium">
        <Calendar size={16} />
        <span>{dateStr} {timeStr && `• ${timeStr}`}</span>
      </div>

      {optimisticEvent.description && (
        <p className="text-main mb-6 whitespace-pre-wrap">{optimisticEvent.description}</p>
      )}

      {/* RSVP Section */}
      <div className="bg-base border border-border-subtle rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Your RSVP</p>
          {isPast && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-border text-muted uppercase tracking-wide">
              Past Event
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button 
            onClick={() => !isPast && handleRSVP('going')}
            disabled={isPast}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${myRsvp === 'going' ? 'bg-success text-on-primary shadow-sm' : 'bg-surface text-muted border border-border-subtle hover:border-success hover:text-success'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <CheckCircle2 size={16} /> <span className="hidden sm:inline">Going</span>
          </button>
          <button 
            onClick={() => !isPast && handleRSVP('maybe')}
            disabled={isPast}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${myRsvp === 'maybe' ? 'bg-warning text-white shadow-sm' : 'bg-surface text-muted border border-border-subtle hover:border-warning hover:text-warning'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <HelpCircle size={16} /> <span className="hidden sm:inline">Maybe</span>
          </button>
          <button 
            onClick={() => !isPast && handleRSVP('cant')}
            disabled={isPast}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${myRsvp === 'cant' ? 'bg-danger text-white shadow-sm' : 'bg-surface text-muted border border-border-subtle hover:border-danger hover:text-danger'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <XCircle size={16} /> <span className="hidden sm:inline">Can't Go</span>
          </button>
        </div>
        
        <div className="flex flex-col gap-1.5 mt-4">
          {(() => {
            const renderRsvpGroup = (status: string, label: string, colorClass: string, bgClass: string) => {
              const userIds = Object.entries(optimisticEvent.rsvps)
                .filter(([_, rsvpStatus]) => rsvpStatus === status)
                .map(([id]) => id);

              if (userIds.length === 0) return null;

              return (
                <div key={status} className={`flex items-center gap-3 p-2.5 rounded-xl border border-border-subtle ${bgClass}`}>
                  <span className={`text-[11px] font-bold uppercase tracking-wider w-16 flex-shrink-0 ${colorClass}`}>{label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {userIds.map(uid => {
                      const u = allUsers.find(user => user.uid === uid);
                      const displayName = u?.displayName || 'Unknown';
                      const initial = displayName.charAt(0).toUpperCase();
                      const avatarColor = u?.avatarColor || 'var(--color-primary)';
                      
                      return (
                        <div 
                          key={uid}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                          style={{ backgroundColor: avatarColor }}
                          title={displayName}
                        >
                          {u?.avatarUrl ? (
                            <img src={u.avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            initial
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            };

            const goingNode = renderRsvpGroup('going', 'Going', 'text-success', 'bg-success/5');
            const maybeNode = renderRsvpGroup('maybe', 'Maybe', 'text-warning', 'bg-warning/5');
            const cantNode = renderRsvpGroup('cant', "Can't", 'text-danger', 'bg-danger/5');

            if (!goingNode && !maybeNode && !cantNode) {
              return <p className="text-xs text-muted font-medium px-1 mt-1">No RSVPs yet</p>;
            }

            return (
              <>
                {goingNode}
                {maybeNode}
                {cantNode}
              </>
            );
          })()}
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
          <EventNotes eventId={optimisticEvent.id} />
        </div>
      )}

      {showEdit && (
        <CreateEventModal eventToEdit={event} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
};
