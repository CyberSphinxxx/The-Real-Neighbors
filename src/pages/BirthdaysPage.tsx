import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { subscribeToCollection, updateDoc } from '../lib/firestore';
import { getDaysUntilBirthday, calculateAgeTurning, isBirthdayToday } from '../utils/date';
import type { User } from '../types';
import { BirthdayMessageBoard } from '../components/birthdays/BirthdayMessageBoard';
import { BirthdayPicker } from '../components/birthdays/BirthdayPicker';
import { SharedCalendar } from '../components/calendar/SharedCalendar';
import confetti from 'canvas-confetti';
import { Loader2, Cake, Edit2, Check, X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export const BirthdaysPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const unsub = subscribeToCollection<User>('users', (data) => {
      setUsers(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const sortedUsers = useMemo(() => {
    const withBday = users.filter(u => u.birthdate);
    const withoutBday = users.filter(u => !u.birthdate);

    withBday.sort((a, b) => getDaysUntilBirthday(a.birthdate!) - getDaysUntilBirthday(b.birthdate!));
    
    // Sort those without birthdays alphabetically
    withoutBday.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return [...withBday, ...withoutBday];
  }, [users]);

  const celebrants = useMemo(() => {
    return users.filter(u => u.birthdate && isBirthdayToday(u.birthdate));
  }, [users]);

  // Trigger confetti if someone has a birthday today
  useEffect(() => {
    if (celebrants.length > 0 && !isLoading) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#var(--color-primary)', '#ffffff']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#var(--color-primary)', '#ffffff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [celebrants.length, isLoading]);

  const handleSaveDate = async (userId: string) => {
    try {
      await updateDoc('users', [userId], { birthdate: editDate });
      toast.success('Birthday updated!');
      setEditingId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update birthday');
    }
  };

  const handleToggleAge = async (u: User) => {
    try {
      const newPref = u.showAge === false ? true : false;
      await updateDoc('users', [u.id], { showAge: newPref });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update preference');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-main tracking-tight flex items-center gap-3">
            <Cake className="text-primary" /> Birthdays
          </h1>
          <p className="text-sm text-muted mt-1">Never miss a celebration!</p>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer bg-surface border border-border-subtle px-3 py-1.5 rounded-lg shadow-sm hover:border-border transition-colors">
          <span className="text-xs font-semibold text-main">Show Ages</span>
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only"
              checked={currentUser?.showAge ?? true}
              onChange={() => { if (currentUser) handleToggleAge(currentUser); }}
            />
            <div className={`block w-8 h-5 rounded-full transition-colors ${currentUser?.showAge !== false ? 'bg-primary' : 'bg-border'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${currentUser?.showAge !== false ? 'translate-x-3' : ''}`}></div>
          </div>
        </label>
      </div>

      <SharedCalendar />

      {celebrants.map(c => (
        <BirthdayMessageBoard key={c.id} celebrant={c} />
      ))}

      <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
        {sortedUsers.map((u, i) => {
          const hasBday = !!u.birthdate;
          const isToday = hasBday && isBirthdayToday(u.birthdate!);
          const daysLeft = hasBday ? getDaysUntilBirthday(u.birthdate!) : -1;
          const showAge = u.showAge !== false;
          const canEdit = isAdmin || u.id === currentUser?.id;
          const isEditing = editingId === u.id;

          let countdownLabel = '';
          if (isToday) countdownLabel = 'Today!';
          else if (daysLeft === 1) countdownLabel = 'Tomorrow';
          else if (daysLeft > 1) countdownLabel = `In ${daysLeft} days`;

          return (
            <div key={u.id} className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${i !== sortedUsers.length - 1 ? 'border-b border-border-subtle/50' : ''} ${isToday ? 'bg-primary/5' : 'hover:bg-base'}`}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm border border-primary/20">
                  {u.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold truncate ${isToday ? 'text-primary' : 'text-main'}`}>
                      {u.displayName}
                    </h3>
                    {isToday && <span className="text-xl animate-bounce">🎂</span>}
                  </div>
                  
                  {hasBday && !isEditing && (
                    <p className="text-sm text-muted">
                      {new Date(u.birthdate!).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                      {showAge && <span className="ml-1 text-faint">• Turning {calculateAgeTurning(u.birthdate!)}</span>}
                    </p>
                  )}
                  {!hasBday && !isEditing && (
                    <p className="text-sm text-faint italic">No birthday set</p>
                  )}

                  {isEditing && (
                    <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                      <BirthdayPicker 
                        value={editDate}
                        onChange={(val) => setEditDate(val)}
                      />
                      <button onClick={() => handleSaveDate(u.id)} disabled={!editDate} className="p-1.5 rounded-full bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-full bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pl-16 sm:pl-0">
                {!isEditing && hasBday && (
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isToday ? 'bg-primary text-on-primary shadow-md' :
                    daysLeft <= 7 ? 'bg-warning/10 text-warning border border-warning/20' :
                    'bg-base text-muted border border-border-subtle'
                  }`}>
                    {countdownLabel}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {u.id === currentUser?.id && hasBday && !isEditing && (
                    <button 
                      onClick={() => handleToggleAge(u)}
                      className={`p-2 rounded-full transition-colors ${showAge ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted hover:bg-base'}`}
                      title={showAge ? "Hide your age" : "Show your age"}
                    >
                      {showAge ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  )}
                  {canEdit && !isEditing && (
                    <button 
                      onClick={() => {
                        setEditDate(u.birthdate || '');
                        setEditingId(u.id);
                      }}
                      className="p-2 rounded-full text-muted hover:bg-base hover:text-main transition-colors"
                      title="Edit birthday"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BirthdaysPage;
