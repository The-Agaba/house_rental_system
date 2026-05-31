import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, User, HelpCircle, AlertCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ReservationQueue = ({ propertyId, onQueueUpdated }) => {
  const [queue, setQueue] = useState(null);
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState('');

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
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [propertyId]);

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
        fetchQueue();
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
    try {
      await axios.put(`/reservations/${resId}/confirm`);
      toast.success('Your reservation is confirmed! Landlord has been notified.');
      fetchQueue();
      if (onQueueUpdated) onQueueUpdated();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to confirm reservation.';
      toast.error(errMsg);
    }
  };

  const handleCancel = async (resId) => {
    if (!window.confirm('Are you sure you want to cancel your reservation and leave the queue?')) {
      return;
    }
    try {
      await axios.put(`/reservations/${resId}/cancel`);
      toast.success('Reservation cancelled successfully');
      fetchQueue();
      if (onQueueUpdated) onQueueUpdated();
    } catch (err) {
      toast.error('Failed to cancel reservation');
    }
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "loop"
    }
  };

  if (!queue) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-8"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500/20 border-t-primary-600 animate-spin" />
          <p className="text-xs text-slate-400 animate-pulse">Loading queue...</p>
        </div>
      </motion.div>
    );
  }

  const isUserConfirming = activeReservation?.tenantId === user?.id;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-6"
    >
      {/* Active Confirmation Status */}
      <AnimatePresence mode="wait">
        {activeReservation && (
          <motion.div
            key="active-confirmation"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/70 dark:border-amber-900/30 relative overflow-hidden"
          >
            {/* Animated background pulse */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent"
              animate={{ x: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="relative z-10 flex items-center gap-3">
              <motion.div 
                animate={pulseAnimation}
                className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0"
              >
                <Clock size={20} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                  Active Window (24 hrs)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Current turn: <span className="font-bold text-slate-900 dark:text-slate-200">{activeReservation.tenantFullName}</span>
                </p>
              </div>
              <motion.div 
                className="text-right shrink-0"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <p className="text-lg font-mono font-extrabold text-amber-600 dark:text-amber-400">
                  {timeRemaining}
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  remaining
                </p>
              </motion.div>
            </div>

            {isUserConfirming && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 pt-4 border-t border-amber-100/60 dark:border-amber-900/20 flex flex-col sm:flex-row gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConfirm(activeReservation.id)}
                  className="btn-primary w-full !py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-lg shadow-primary-600/10"
                >
                  <CheckCircle2 size={16} /> Confirm Reservation Now
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCancel(activeReservation.id)}
                  className="btn-secondary w-full sm:w-auto !py-2.5 text-xs font-bold border border-red-200 dark:border-red-950 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15"
                >
                  Cancel &amp; Exit Queue
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue position list */}
      <motion.div variants={fadeInUp}>
        <motion.h3 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 ml-1"
        >
          Active Reservation Queue ({queue.totalInQueue})
        </motion.h3>
        
        <AnimatePresence mode="wait">
          {queue.activeReservations.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <HelpCircle className="mx-auto mb-3 opacity-30" size={32} />
              </motion.div>
              <p className="text-xs font-medium">The queue is currently empty. Be the first to join!</p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {queue.activeReservations.map((res, index) => {
                  const isMe = res.tenantId === user?.id;
                  
                  return (
                    <motion.div
                      key={res.id}
                      variants={staggerItem}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                      layout
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        isMe 
                          ? 'border-primary-400 bg-primary-50/20 dark:bg-primary-950/10 shadow-sm relative overflow-hidden'
                          : 'border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900/20'
                      }`}
                    >
                      {/* Animated highlight for user's position */}
                      {isMe && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                      
                      <div className="relative z-10 flex items-center gap-3 flex-1">
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                            res.status === 'awaiting_confirmation'
                              ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                              : res.status === 'confirmed'
                              ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          #{index + 1}
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <motion.p 
                              className={`text-xs font-bold text-slate-900 dark:text-white ${isMe ? 'text-primary-700 dark:text-primary-400' : ''}`}
                              animate={isMe ? { color: ['#2563eb', '#3b82f6', '#2563eb'] } : {}}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              {res.tenantFullName} {isMe && '(You)'}
                            </motion.p>
                            {res.status === 'awaiting_confirmation' && (
                              <motion.span 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                              >
                                Awaiting Turn
                              </motion.span>
                            )}
                            {res.status === 'confirmed' && (
                              <motion.span 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                              >
                                Confirmed
                              </motion.span>
                            )}
                          </div>
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5"
                          >
                            Planned Move-in: {new Date(res.moveInDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {res.durationMonths} months stay
                          </motion.p>
                        </div>
                      </div>

                      {isMe && res.status === 'queued' && (
                        <motion.button
                          whileHover={{ scale: 1.05, backgroundColor: '#fee2e2' }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCancel(res.id)}
                          className="relative z-10 text-[10px] font-extrabold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 py-1 rounded-lg transition-all"
                        >
                          Leave Queue
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Queue Info Animation */}
      {queue.totalInQueue > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Total in queue: {queue.totalInQueue}</span>
            <motion.span 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-primary-500"
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ReservationQueue;