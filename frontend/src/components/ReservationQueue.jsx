import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, User, HelpCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ReservationQueue = ({ propertyId, onQueueUpdated }) => {
  const [queue, setQueue] = useState(null);
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchQueue = async () => {
    try {
      const res = await axios.get(`/reservations/property/${propertyId}/queue`);
      setQueue(res.data);
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000); // refresh queue status
    return () => clearInterval(interval);
  }, [propertyId]);

  // Handle countdown for active confirmation reservation
  const activeReservation = queue?.activeReservations?.find(
    (r) => r.status === 'awaiting_confirmation'
  );

  useEffect(() => {
    if (!activeReservation?.confirmationDeadline) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const deadline = new Date(activeReservation.confirmationDeadline).getTime();
      const now = new Date().getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        fetchQueue(); // refresh queue as scheduler will expire it
        return;
      }

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hrs.toString().padStart(2, '0')}:${mins
          .toString()
          .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeReservation]);

  const handleConfirm = async (resId) => {
    setConfirmingId(resId);
    try {
      await axios.put(`/reservations/${resId}/confirm`);
      toast.success('Your reservation is confirmed! Landlord has been notified.');
      fetchQueue();
      if (onQueueUpdated) onQueueUpdated();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to confirm reservation.';
      toast.error(errMsg);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCancel = async (resId) => {
    if (!window.confirm('Are you sure you want to cancel your reservation and leave the queue?')) {
      return;
    }
    setCancellingId(resId);
    try {
      await axios.put(`/reservations/${resId}/cancel`);
      toast.success('Reservation cancelled successfully');
      fetchQueue();
      if (onQueueUpdated) onQueueUpdated();
    } catch (err) {
      toast.error('Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  if (!queue) {
    return <div className="text-xs text-slate-400">Loading queue...</div>;
  }

  const isUserConfirming = activeReservation?.tenantId === user?.id;

  return (
    <div className="space-y-6">
      {/* Active Confirmation Status */}
      {activeReservation && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/70 dark:border-amber-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={20} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                Active Window (24 hrs)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Current turn: <span className="font-bold text-slate-900 dark:text-slate-200">{activeReservation.tenantFullName}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-mono font-extrabold text-amber-600 dark:text-amber-400">
                {timeRemaining}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                remaining
              </p>
            </div>
          </div>

          {isUserConfirming && (
            <div className="mt-4 pt-4 border-t border-amber-100/60 dark:border-amber-900/20 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleConfirm(activeReservation.id)}
                disabled={confirmingId === activeReservation.id}
                className="btn-primary w-full !py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-lg shadow-primary-600/10 disabled:opacity-70 disabled:cursor-wait"
              >
                {confirmingId === activeReservation.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                {confirmingId === activeReservation.id ? 'Confirming...' : 'Confirm Reservation Now'}
              </button>
              <button
                onClick={() => handleCancel(activeReservation.id)}
                disabled={cancellingId === activeReservation.id}
                className="btn-secondary w-full sm:w-auto !py-2.5 text-xs font-bold border border-red-200 dark:border-red-950 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15 disabled:opacity-70 disabled:cursor-wait inline-flex items-center justify-center gap-1.5"
              >
                {cancellingId === activeReservation.id ? <Loader2 className="animate-spin" size={16} /> : null}
                {cancellingId === activeReservation.id ? 'Cancelling...' : 'Cancel & Exit Queue'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Queue position list */}
      <div>
        <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 ml-1">
          Active Reservation Queue ({queue.totalInQueue})
        </h3>
        
        {queue.activeReservations.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500">
            <HelpCircle className="mx-auto mb-2 opacity-30" size={28} />
            <p className="text-xs font-medium">The queue is currently empty. Be the first to join!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.activeReservations.map((res, index) => {
              const isMe = res.tenantId === user?.id;
              
              return (
                <div
                  key={res.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isMe 
                      ? 'border-primary-400 bg-primary-50/20 dark:bg-primary-950/10 shadow-sm'
                      : 'border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                      res.status === 'awaiting_confirmation'
                        ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                        : res.status === 'confirmed'
                        ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-bold text-slate-900 dark:text-white ${isMe ? 'text-primary-700 dark:text-primary-400' : ''}`}>
                          {res.tenantFullName} {isMe && '(You)'}
                        </p>
                        {res.status === 'awaiting_confirmation' && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                            Awaiting Turn
                          </span>
                        )}
                        {res.status === 'confirmed' && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                            Confirmed
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                        Planned Move-in: {new Date(res.moveInDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {res.durationMonths} months stay
                      </p>
                    </div>
                  </div>

                  {isMe && res.status === 'queued' && (
                    <button
                      onClick={() => handleCancel(res.id)}
                      disabled={cancellingId === res.id}
                      className="text-[10px] font-extrabold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 py-1 rounded-lg transition-all disabled:opacity-70 disabled:cursor-wait inline-flex items-center gap-1"
                    >
                      {cancellingId === res.id ? <Loader2 className="animate-spin" size={10} /> : null}
                      {cancellingId === res.id ? 'Leaving...' : 'Leave Queue'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationQueue;
