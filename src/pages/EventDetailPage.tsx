import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getDoc } from '../lib/firestore';
import type { Event, User } from '../types';
import { EventCard } from '../components/events/EventCard';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<Record<string, User>>({});

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'events', id), (snapshot) => {
      if (snapshot.exists()) {
        setEvent({ id: snapshot.id, ...snapshot.data() } as Event);
      } else {
        setEvent(null);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!event) return;
    const userIds = Object.keys(event.rsvps);
    if (userIds.length === 0) return;

    // Fetch user details for all RSVPs
    const fetchUsers = async () => {
      const usersData: Record<string, User> = {};
      await Promise.all(
        userIds.map(async (uid) => {
          if (!users[uid]) {
            const u = await getDoc<User>('users', [uid]);
            if (u) usersData[uid] = u;
          }
        })
      );
      setUsers(prev => ({ ...prev, ...usersData }));
    };
    fetchUsers();
  }, [event?.rsvps]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-main mb-2">Event Not Found</h2>
        <p className="text-muted mb-6">This event may have been deleted.</p>
        <button onClick={() => navigate('/events')} className="text-primary hover:underline">
          Go back to Events
        </button>
      </div>
    );
  }

  const going = Object.entries(event.rsvps).filter(([_, status]) => status === 'going').map(([uid]) => users[uid]);
  const maybe = Object.entries(event.rsvps).filter(([_, status]) => status === 'maybe').map(([uid]) => users[uid]);
  const cant = Object.entries(event.rsvps).filter(([_, status]) => status === 'cant').map(([uid]) => users[uid]);

  const renderRsvpList = (title: string, list: (User | undefined)[], colorClass: string) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-4">
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${colorClass}`}>{title} ({list.length})</h4>
        <div className="flex flex-wrap gap-2">
          {list.map((u) => u ? (
            <div key={u.id} className="flex items-center gap-2 bg-surface border border-border-subtle rounded-full px-2 py-1 pr-3 shadow-sm">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${colorClass.replace('text-', 'bg-').replace('-500', '-500/20')}`}>
                {u.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-main">{u.displayName}</span>
            </div>
          ) : null)}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-6 pb-24">
      <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted hover:text-main transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Events
      </Link>

      <EventCard event={event} />

      <div className="mt-8 bg-base border border-border-subtle rounded-2xl p-5 shadow-sm">
        <h3 className="font-heading font-semibold text-main mb-6">RSVP Details</h3>
        
        {Object.keys(event.rsvps).length === 0 ? (
          <p className="text-sm text-faint italic">No RSVPs yet.</p>
        ) : (
          <>
            {renderRsvpList('Going', going, 'text-success')}
            {renderRsvpList('Maybe', maybe, 'text-warning')}
            {renderRsvpList("Can't Go", cant, 'text-danger')}
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetailPage;
