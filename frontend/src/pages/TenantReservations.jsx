import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  Loader2,
  MapPin,
  Timer,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatTzs } from '../utils/currency';

const activeQueueStatuses = ['queued', 'awaiting_confirmation', 'confirmed'];

const statusStyles = {
  queued: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  awaiting_confirmation: 'bg-primary-100 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  accepted: 'bg-emerald-600 text-white',
  cancelled: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  expired: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
};

const getLeaseEndDate = (moveInDate, durationMonths) => {
  if (!moveInDate || !durationMonths) return null;
  const date = new Date(moveInDate);
  if (Number.isNaN(date.getTime())) return null;
  date.setMonth(date.getMonth() + Number(durationMonths));
  return date.toISOString().slice(0, 10);
};

const formatStatus = (status) => (status || 'unknown').replaceAll('_', ' ');

const TenantReservations = ({ mode = 'queue' }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const isRentals = mode === 'rentals';

  const fetchReservations = async () => {
    try {
      const res = await axios.get('/reservations/my');
      setReservations(res.data || []);
    } catch (err) {
      toast.error('Failed to load your reservation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const visibleReservations = useMemo(() => {
    const sorted = [...reservations].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return isRentals
      ? sorted.filter(item => item.status === 'accepted')
      : sorted.filter(item => item.status !== 'accepted');
  }, [isRentals, reservations]);

  const handleReservationAction = async (reservationId, action) => {
    setUpdatingId(reservationId);
    try {
      await axios.put(`/reservations/${reservationId}/${action}`);
      toast.success(action === 'confirm' ? 'Reservation confirmed' : 'Reservation cancelled');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to update reservation');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary-600" size={40} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading tenant details...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-[#08091a] min-h-screen">
      <div className="container py-10 md:py-14">
        <div className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3">
              Tenant area
            </p>
            <h1 className="text-3xl md:text-5xl font-black text-slate-950 dark:text-white">
              {isRentals ? 'My Rented Houses' : 'My Queue Details'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              {isRentals
                ? 'Review the houses approved for you, where to report, the lease period, and what to carry before moving in.'
                : 'Track your reservation position, confirmation status, move-in date, duration, and estimated cost.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/tenant/queue" className={isRentals ? 'btn-secondary !py-2.5 !px-5 text-xs' : 'btn-primary !py-2.5 !px-5 text-xs'}>
              <Clock size={15} /> Queue Details
            </Link>
            <Link to="/tenant/rentals" className={isRentals ? 'btn-primary !py-2.5 !px-5 text-xs' : 'btn-secondary !py-2.5 !px-5 text-xs'}>
              <Home size={15} /> Rented Houses
            </Link>
          </div>
        </div>

        {isRentals && (
          <div className="mb-8 rounded-3xl border border-primary-100 dark:border-primary-900/40 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-premium">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="flex gap-3">
                <MapPin className="text-primary-600 shrink-0" size={22} />
                <div>
                  <h2 className="text-sm font-black text-slate-950 dark:text-white">Where to report</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    Report at the property location shown on your accepted reservation, then meet the landlord or assigned agent for handover.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <FileText className="text-primary-600 shrink-0" size={22} />
                <div>
                  <h2 className="text-sm font-black text-slate-950 dark:text-white">Contract to carry</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    Carry your signed rental contract or lease agreement, payment proof, and a valid identification document.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Timer className="text-primary-600 shrink-0" size={22} />
                <div>
                  <h2 className="text-sm font-black text-slate-950 dark:text-white">Time to stay</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    Your stay starts on the move-in date and lasts for the reservation duration shown on the house card.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {visibleReservations.length > 0 ? (
          <div className="grid gap-6">
            {visibleReservations.map((item, index) => {
              const leaseEnd = getLeaseEndDate(item.moveInDate, item.durationMonths);
              const isActiveQueue = activeQueueStatuses.includes(item.status);
              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-premium"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`badge ${statusStyles[item.status] || 'bg-slate-100 text-slate-600'}`}>
                          {formatStatus(item.status)}
                        </span>
                        {isActiveQueue && (
                          <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            Queue #{item.queuePosition || '-'}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white">
                        {item.propertyTitle}
                      </h2>
                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <MapPin size={16} className="text-primary-600" />
                        {item.propertyLocation || 'Property location will be provided by the landlord'}
                      </p>
                    </div>

                    <Link to={`/properties/${item.propertyId}`} className="btn-secondary !py-2.5 !px-5 text-xs self-start">
                      View House Details
                    </Link>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/40 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Move-in</p>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{item.moveInDate || 'Pending'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/40 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</p>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{item.durationMonths || 0} months</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/40 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated cost</p>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatTzs(item.estimatedTotalCost)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/40 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRentals ? 'Expected end' : 'Joined queue'}</p>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {isRentals ? leaseEnd || 'Pending' : new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {isRentals ? (
                    <div className="mt-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      <CheckCircle2 size={18} className="inline-block mr-2 align-text-bottom" />
                      Report to the property on {item.moveInDate || 'your move-in date'}, carry the required contract documents, and use this page to confirm your approved stay period before moving in.
                    </div>
                  ) : item.status === 'awaiting_confirmation' ? (
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-primary-100 dark:border-primary-900/40 bg-primary-50/70 dark:bg-primary-950/20 p-4">
                      <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">
                        Your turn is ready. Confirm this reservation before the deadline so the landlord can accept it.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReservationAction(item.id, 'cancel')}
                          className="btn-secondary !py-2.5 !px-5 text-xs disabled:opacity-70 disabled:cursor-wait inline-flex items-center justify-center gap-1.5"
                          disabled={updatingId === item.id}
                        >
                          {updatingId === item.id ? <Loader2 className="animate-spin" size={15} /> : <XCircle size={15} />}
                          {updatingId === item.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                        <button
                          onClick={() => handleReservationAction(item.id, 'confirm')}
                          className="btn-primary !py-2.5 !px-5 text-xs"
                          disabled={updatingId === item.id}
                        >
                          {updatingId === item.id ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
                          Confirm
                        </button>
                      </div>
                    </div>
                  ) : null}
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-premium">
            <AlertCircle className="mx-auto mb-4 text-slate-300 dark:text-slate-700" size={46} />
            <h2 className="text-xl font-black text-slate-950 dark:text-white">
              {isRentals ? 'No rented houses yet' : 'No queue records yet'}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              {isRentals
                ? 'Accepted reservations will appear here with reporting instructions and stay details.'
                : 'Join a property reservation queue and your status will appear here.'}
            </p>
            <Link to="/properties" className="btn-primary mt-6 !py-2.5 !px-5 text-xs">
              <CalendarDays size={15} /> Browse Properties
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantReservations;
