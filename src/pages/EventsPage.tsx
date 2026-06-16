import React, { useState, useEffect, useMemo } from 'react';
import { useEventsStore } from '../stores/eventsStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
const CACHE_TTL = 2 * 60 * 1000;
import type { Event } from '../types';
import { EventCard } from '../components/events/EventCard';
import { CreateEventModal } from '../components/events/CreateEventModal';
import { SharedCalendar } from '../components/calendar/SharedCalendar';
import { Calendar, Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export const EventsPage: React.FC = () => {
  const { events, fetchedAt, setEvents } = useEventsStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [prefillEvent, setPrefillEvent] = useState<Partial<Event> | undefined>(undefined);

  useEffect(() => {
    if ((location.state as any)?.prefillEvent) {
      setPrefillEvent((location.state as any).prefillEvent);
      setShowModal(true);
      // Clean up state
      navigate('/events', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      if (fetchedAt && Date.now() - fetchedAt < CACHE_TTL) {
        setIsLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
        if (isMounted) {
          setEvents(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch events', err);
        if (isMounted) setIsLoading(false);
      }
    };
    fetchEvents();
    return () => { isMounted = false; };
  }, [fetchedAt, setEvents]);

  const { upcoming, past } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const up: Event[] = [];
    const pa: Event[] = [];

    events.forEach(e => {
      const eventTime = typeof e.date === 'string' ? new Date(e.date).getTime() : typeof e.date === 'number' ? e.date : 0;
      if (eventTime >= todayMs) up.push(e);
      else pa.push(e);
    });

    // Sort upcoming ascending (closest first)
    up.sort((a, b) => {
      const timeA = typeof a.date === 'string' ? new Date(a.date).getTime() : typeof a.date === 'number' ? a.date : 0;
      const timeB = typeof b.date === 'string' ? new Date(b.date).getTime() : typeof b.date === 'number' ? b.date : 0;
      return timeA - timeB;
    });

    // Sort past descending (most recent first)
    pa.sort((a, b) => {
      const timeA = typeof a.date === 'string' ? new Date(a.date).getTime() : typeof a.date === 'number' ? a.date : 0;
      const timeB = typeof b.date === 'string' ? new Date(b.date).getTime() : typeof b.date === 'number' ? b.date : 0;
      return timeB - timeA;
    });

    return { upcoming: up, past: pa };
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 pb-24 relative min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-main tracking-tight flex items-center gap-3">
            <Calendar className="text-primary" /> Upcoming Events
          </h1>
          <p className="text-sm text-muted mt-1">Plan hangouts, trips, and gaming sessions.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary text-sm font-bold shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:bg-primary-hover transition-all"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Event</span>
        </button>
      </div>

      <SharedCalendar />

      <div className="space-y-6">
        {upcoming.length === 0 ? (
          <div className="text-center py-12 bg-surface border border-border-subtle rounded-2xl border-dashed">
            <Calendar size={48} className="mx-auto text-muted mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-main mb-1">No upcoming events</h3>
            <p className="text-sm text-muted">Why not plan something fun?</p>
          </div>
        ) : (
          upcoming.map(event => <EventCard key={event.id} event={event} />)
        )}
      </div>

      {past.length > 0 && (
        <div className="mt-12">
          <button 
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-main transition-colors mb-4"
          >
            {showPast ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Past Events ({past.length})
          </button>
          
          {showPast && (
            <div className="space-y-6 opacity-75">
              {past.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </div>
      )}



      {showModal && (
        <CreateEventModal 
          onClose={() => {
            setShowModal(false);
            setPrefillEvent(undefined);
          }} 
          eventToEdit={undefined}
          prefillEvent={prefillEvent}
        />
      )}</div>
  );
};

export default EventsPage;
