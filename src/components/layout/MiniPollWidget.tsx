import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { updateDoc, subscribeToCollection, getDoc, addDoc } from '../../lib/firestore';
import type { Poll, User } from '../../types';
import { Plus, Check, Loader2 } from 'lucide-react';

const MiniPollWidgetComponent: React.FC = () => {
  const { user } = useAuthStore();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [pollAuthor, setPollAuthor] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([{ id: '1', label: '' }, { id: '2', label: '' }]);
  const [durationStr, setDurationStr] = useState((24 * 60 * 60 * 1000).toString());


  useEffect(() => {
    // We can't use where('isActive', '==', true) easily with orderBy('createdAt', 'desc') 
    // unless we have an index. Let's just fetch all active or recent polls and sort client side
    const unsubscribe = subscribeToCollection<Poll>(
      'polls',
      (data) => {
        const activePolls = data.filter(p => p.isActive);
        // sort by createdAt desc
        activePolls.sort((a, b) => b.createdAt - a.createdAt);
        const latest = activePolls[0] || null;
        
        if (latest) {
          const now = Date.now();
          if (latest.expiresAt < now) {
            // Expired, but still marked active. Let's keep showing it but mark as read-only.
            // Admin could optionally clean it up.
          }
          setPoll(latest);
        } else {
          setPoll(null);
        }
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (poll?.createdBy) {
      getDoc<User>('users', [poll.createdBy]).then(u => {
        if (u) setPollAuthor(u);
      });
    }
  }, [poll?.createdBy]);

  // Expiry check
  useEffect(() => {
    if (!poll) return;
    const checkExpiry = () => {
      if (poll.expiresAt <= Date.now() && poll.isActive) {
        updateDoc('polls', [poll.id], { isActive: false }).catch(console.error);
      }
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [poll]);

  const handleVote = async (optionId: string) => {
    if (!poll || !user || isExpired) return;
    const oldPoll = poll;
    try {
      const newVotes = { ...poll.votes, [user.id]: optionId };
      setPoll({ ...poll, votes: newVotes });
      await updateDoc('polls', [poll.id], { votes: newVotes });
    } catch (e) {
      setPoll(oldPoll);
      console.error('Failed to vote', e);
    }
  };

  const handleCreatePoll = async () => {
    if (!question.trim() || options.some(o => !o.label.trim()) || !user) return;
    setIsSubmitting(true);
    try {
      const durationMs = parseInt(durationStr);
      const newPoll: Omit<Poll, 'id'> = {
        question: question.trim(),
        options: options.map((o, i) => ({ id: `opt_${i}`, label: o.label.trim() })),
        votes: {},
        createdBy: user.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + durationMs,
        isActive: true,
      };
      // Auto close previous polls
      if (poll) {
        await updateDoc('polls', [poll.id], { isActive: false });
      }
      await addDoc('polls', newPoll);
      
      import('../../lib/notifications').then(({ broadcastNotification }) => {
        broadcastNotification({
          type: 'poll',
          fromUid: user.id,
          fromName: user.displayName,
          fromAvatarColor: user.accentColor || '#3b82f6',
          message: `${user.displayName} created a new poll: ${question.trim()}`,
        }, 'polls');
      });

      setIsCreating(false);
      setQuestion('');
      setOptions([{ id: '1', label: '' }, { id: '2', label: '' }]);
    } catch (e) {
      console.error('Failed to create poll', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, { id: Date.now().toString(), label: '' }]);
    }
  };

  if (isLoading) return null;
  if (!poll && !isCreating) return (
    <div 
      className="bg-surface rounded-xl shadow-sm p-4 flex flex-col items-center justify-center gap-3"
      style={{ border: '1px solid var(--color-border-subtle)' }}
    >
      <div className="text-4xl mb-1">🗳️</div>
      <button 
        onClick={() => setIsCreating(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
      >
        <Plus size={16} /> Create Poll
      </button>
    </div>
  );

  const now = Date.now();
  const isExpired = poll ? poll.expiresAt < now || !poll.isActive : false;
  const totalVotes = poll ? Object.keys(poll.votes || {}).length : 0;
  const hasVoted = poll ? !!(poll.votes && poll.votes[user?.id || '']) : false;
  const showResults = hasVoted || isExpired;

  const renderCreateForm = () => (
    <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
      <input
        type="text"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full bg-base border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
      />
      
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <input
            key={i}
            type="text"
            placeholder={`Option ${i + 1}`}
            value={opt.label}
            onChange={(e) => {
              const newOpts = [...options];
              newOpts[i].label = e.target.value;
              setOptions(newOpts);
            }}
            className="w-full bg-base border border-border-subtle rounded-lg px-3 py-1.5 text-sm focus:border-primary outline-none"
          />
        ))}
      </div>
      
      {options.length < 4 && (
        <button
          onClick={addOption}
          className="text-primary text-xs font-semibold self-start hover:underline"
        >
          + Add option
        </button>
      )}

      <div className="flex items-center gap-2 mt-1">
        <select 
          value={durationStr}
          onChange={(e) => setDurationStr(e.target.value)}
          className="bg-base border border-border-subtle rounded-lg px-2 py-1.5 text-xs outline-none"
        >
          <option value={30 * 60 * 1000}>30 minutes</option>
          <option value={60 * 60 * 1000}>1 hour</option>
          <option value={3 * 60 * 60 * 1000}>3 hours</option>
          <option value={6 * 60 * 60 * 1000}>6 hours</option>
          <option value={12 * 60 * 60 * 1000}>12 hours</option>
          <option value={24 * 60 * 60 * 1000}>24 hours</option>
          <option value={3 * 24 * 60 * 60 * 1000}>3 days</option>
        </select>
        <button
          onClick={handleCreatePoll}
          disabled={isSubmitting || !question.trim() || options.some(o => !o.label.trim())}
          className="flex-1 bg-primary text-on-primary py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary-hover transition-colors flex justify-center items-center"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Post Poll'}
        </button>
      </div>
      <button 
        onClick={() => setIsCreating(false)}
        className="text-muted text-xs hover:text-main"
      >
        Cancel
      </button>
    </div>
  );

  return (
    <div 
      className="bg-surface rounded-xl shadow-sm p-4"
      style={{ border: '1px solid var(--color-border-subtle)' }}
    >
      {!poll ? (
        renderCreateForm()
      ) : (
        <>
          {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Poll
          </h3>
          {pollAuthor && (
            <span className="text-xs text-faint">
              by {pollAuthor.displayName}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="font-medium text-sm text-main leading-snug">
          {poll.question}
        </h4>
        
        <div className="flex flex-col gap-2 relative">
          {(() => {
            const voteCounts = poll.options.map(opt => ({
              id: opt.id,
              count: Object.values(poll.votes || {}).filter(v => v === opt.id).length
            }));
            const maxVotes = Math.max(...voteCounts.map(vc => vc.count), 0);
            
            return poll.options.map(opt => {
              const votesForOption = voteCounts.find(vc => vc.id === opt.id)?.count || 0;
              const percentage = totalVotes > 0 ? Math.round((votesForOption / totalVotes) * 100) : 0;
              const isSelected = poll.votes?.[user?.id || ''] === opt.id;
              const isWinner = isExpired && maxVotes > 0 && votesForOption === maxVotes;
              
              return (
                <button
                  key={opt.id}
                  onClick={() => handleVote(opt.id)}
                  disabled={isExpired}
                  className={`relative w-full text-left rounded-lg p-2 text-sm transition-colors overflow-hidden flex items-center justify-between z-10 ${
                    isSelected
                      ? 'border-primary text-primary font-semibold'
                      : 'border-default hover:bg-elevated text-main'
                  } border ${isExpired ? 'cursor-default' : 'cursor-pointer'}`}
                  style={{
                    background: isSelected && !showResults ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : undefined
                  }}
                >
                  {/* Progress bar background */}
                  {showResults && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 z-0 bg-primary/10 transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-2">
                    <span>{opt.label}</span>
                    {isSelected && !isExpired && <Check size={14} className="text-primary" />}
                    {isWinner && <span className="text-emerald-500 font-bold ml-1">✅</span>}
                  </div>
                  
                  {showResults && (
                    <div className="relative z-10 text-xs text-muted font-medium">
                      {votesForOption} ({percentage}%)
                    </div>
                  )}
                </button>
              );
            });
          })()}
        </div>

        <div className="flex justify-between items-center mt-1 text-[11px] text-faint">
          <span>{totalVotes} total votes</span>
          {isExpired ? (
            <span className="font-semibold text-muted">Poll ended</span>
          ) : (
            <span>Ends in {Math.max(1, Math.round((poll.expiresAt - now) / (60 * 60 * 1000)))} hours</span>
          )}
        </div>
        </div>
        </>
      )}
    </div>
  );
};

export const MiniPollWidget = React.memo(MiniPollWidgetComponent);
