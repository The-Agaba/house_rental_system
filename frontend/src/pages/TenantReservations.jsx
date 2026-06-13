import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  Home,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Timer,
  User,
  Wrench,
  X,
  XCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatTzs } from '../utils/currency';

const activeQueueStatuses = ['pending_landlord_confirmation', 'confirmed'];

const statusStyles = {
  pending_landlord_confirmation: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
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

/* ─── Dropdown animation variants ─── */
const dropdownVariants = {
  hidden: { height: 0, opacity: 0, marginTop: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    marginTop: 24,
    transition: {
      height: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.25, delay: 0.05 },
      marginTop: { duration: 0.2 }
    }
  },
  exit: {
    height: 0,
    opacity: 0,
    marginTop: 0,
    transition: {
      height: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.15 },
      marginTop: { duration: 0.15 }
    }
  }
};

/* ─── Info card sub-component ─── */
const InfoCard = ({ icon: Icon, title, children, accent = 'primary' }) => {
  const colorMap = {
    primary: 'border-primary-100 dark:border-primary-900/40 bg-primary-50/40 dark:bg-primary-950/20',
    emerald: 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20',
    amber: 'border-amber-100 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20',
    slate: 'border-slate-100 dark:border-slate-700/40 bg-slate-50/40 dark:bg-slate-800/30',
  };
  const iconColor = {
    primary: 'text-primary-600 dark:text-primary-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    slate: 'text-slate-500 dark:text-slate-400',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[accent]}`}>
      <div className="flex items-center gap-2.5 mb-3">
        <Icon size={18} className={iconColor[accent]} />
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
};

const InfoRow = ({ label, value, bold = false }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</span>
    <span className={`text-sm ${bold ? 'font-black' : 'font-semibold'} text-slate-900 dark:text-white`}>{value || 'N/A'}</span>
  </div>
);

/* ─── Rental Details Dropdown ─── */
const RentalDetailsDropdown = ({ item, isOpen }) => {
  const leaseEnd = getLeaseEndDate(item.moveInDate, item.durationMonths);
  const [downloading, setDownloading] = useState(false);
  const [letterUrl, setLetterUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (letterUrl) {
        window.URL.revokeObjectURL(letterUrl);
      }
    };
  }, [letterUrl]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await axios.get(`/reservations/${item.id}/confirmation-letter`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rental_Confirmation_${item.propertyTitle?.replace(/[^a-zA-Z0-9]/g, '_') || item.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Confirmation letter downloaded!');
    } catch (err) {
      toast.error('Failed to download confirmation letter');
    } finally {
      setDownloading(false);
    }
  };

  const handleViewInSystem = async () => {
    try {
      const res = await axios.get(`/reservations/${item.id}/confirmation-letter`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setLetterUrl((currentUrl) => {
        if (currentUrl) {
          window.URL.revokeObjectURL(currentUrl);
        }
        return url;
      });
    } catch (err) {
      toast.error('Failed to load confirmation letter');
    }
  };

  const closeLetterPreview = () => {
    if (letterUrl) {
      window.URL.revokeObjectURL(letterUrl);
    }
    setLetterUrl(null);
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="overflow-hidden"
        >
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-primary-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-primary-950/10 p-5 md:p-7">

            {/* Grid of info cards */}
            <div className="grid gap-4 md:grid-cols-2">

              {/* 📍 Property Location */}
              <InfoCard icon={MapPin} title="Property Location" accent="primary">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {item.propertyLocation || 'Location will be provided by the landlord'}
                </p>
              </InfoCard>

              {/* 👤 Landlord Contact */}
              <InfoCard icon={User} title="Landlord Contact" accent="emerald">
                <InfoRow label="Full Name" value={item.landlordFullName} bold />
                <div className="flex items-center gap-2 mt-1">
                  <Mail size={13} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.landlordEmail || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.landlordPhone || 'N/A'}</span>
                </div>
              </InfoCard>

              {/* 📅 Lease Period */}
              <InfoCard icon={CalendarDays} title="Lease Period & Stay" accent="primary">
                <InfoRow label="Move-in Date" value={item.moveInDate || 'Pending'} bold />
                <InfoRow label="Move-out Date" value={leaseEnd || 'Pending'} bold />
                <InfoRow label="Duration" value={`${item.durationMonths || 0} month(s)`} />
                <InfoRow label="Total Cost" value={formatTzs(item.estimatedTotalCost)} bold />
              </InfoCard>

              {/* 📋 Reporting Instructions */}
              <InfoCard icon={FileText} title="Move-in Instructions" accent="slate">
                <ul className="space-y-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span>Report at the property on <strong className="text-slate-800 dark:text-white">{item.moveInDate || 'your move-in date'}</strong> and meet the landlord or assigned agent for handover.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span>Carry your signed rental contract, payment proof, and a valid ID document.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span>Your stay lasts from <strong className="text-slate-800 dark:text-white">{item.moveInDate || '—'}</strong> to <strong className="text-slate-800 dark:text-white">{leaseEnd || '—'}</strong>.</span>
                  </li>
                </ul>
              </InfoCard>
            </div>

            {/* 🔧 Extension & Maintenance notice */}
            <div className="mt-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/15 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={16} className="text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Extension & Maintenance</h3>
              </div>
              <p className="text-[13px] font-medium text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                To extend your lease or request maintenance, please <strong>contact your landlord directly</strong> using the contact details above. These features are not yet available in the system and will be added in a future update.
              </p>
            </div>

            {/* 📄 Confirmation Letter Actions */}
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Rental Confirmation Letter</h3>
                <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500 leading-relaxed">
                  Download or view your official confirmation letter — proof that you are an approved tenant for this property.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleViewInSystem}
                  className="btn-secondary !py-2.5 !px-4 text-xs inline-flex items-center gap-1.5"
                  id={`view-letter-${item.id}`}
                >
                  <Eye size={15} />
                  View Letter
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn-primary !py-2.5 !px-4 text-xs inline-flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-wait"
                  id={`download-letter-${item.id}`}
                >
                  {downloading ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />}
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {letterUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center px-4 py-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="w-full max-w-5xl h-[82vh] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">Rental Confirmation Letter</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.propertyTitle}</p>
              </div>
              <button
                type="button"
                onClick={closeLetterPreview}
                className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
                aria-label="Close confirmation letter preview"
              >
                <X size={18} />
              </button>
            </div>
            <iframe
              src={letterUrl}
              title="Rental confirmation letter preview"
              className="flex-1 w-full bg-slate-100 dark:bg-slate-900"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

/* ─── Main Component ─── */
const TenantReservations = ({ mode = 'queue' }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to update reservation');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
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
              {isRentals ? 'My Rented Houses' : 'My Reservations'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              {isRentals
                ? 'Review the houses approved for you, where to report, the lease period, and what to carry before moving in.'
                : 'Track your active property holds, viewing appointment confirmation, move-in date, duration, and estimated cost.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/tenant/queue" className={isRentals ? 'btn-secondary !py-2.5 !px-5 text-xs' : 'btn-primary !py-2.5 !px-5 text-xs'}>
              <Clock size={15} /> Reservations
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
              const isExpanded = expandedId === item.id;
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
                            24-hour hold
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

                    {/* Toggle button for accepted rentals, link for others */}
                    {isRentals ? (
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className={`btn-secondary !py-2.5 !px-5 text-xs self-start inline-flex items-center gap-2 transition-colors duration-200 ${
                          isExpanded
                            ? '!bg-primary-600 !text-white !border-primary-600 dark:!bg-primary-500 dark:!border-primary-500'
                            : ''
                        }`}
                        id={`toggle-details-${item.id}`}
                      >
                        {isExpanded ? 'Hide Details' : 'Rental Details'}
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="inline-flex"
                        >
                          <ChevronDown size={15} />
                        </motion.span>
                      </button>
                    ) : (
                      <Link to={`/properties/${item.propertyId}`} className="btn-secondary !py-2.5 !px-5 text-xs self-start">
                        View House Details
                      </Link>
                    )}
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
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRentals ? 'Expected end' : 'Viewing appointment'}</p>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {isRentals ? leaseEnd || 'Pending' : item.appointmentAt ? new Date(item.appointmentAt).toLocaleString() : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Animated Rental Details Dropdown (only for accepted rentals) */}
                  {isRentals && (
                    <RentalDetailsDropdown item={item} isOpen={isExpanded} />
                  )}

                  {isRentals ? (
                    <div className="mt-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      <CheckCircle2 size={18} className="inline-block mr-2 align-text-bottom" />
                      Report to the property on {item.moveInDate || 'your move-in date'}, carry the required contract documents, and use this page to confirm your approved stay period before moving in.
                    </div>
                  ) : item.status === 'pending_landlord_confirmation' ? (
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-primary-100 dark:border-primary-900/40 bg-primary-50/70 dark:bg-primary-950/20 p-4">
                      <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">
                        This property is held for you while the landlord confirms your requested viewing appointment.
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
                : 'Reserve a property and your status will appear here.'}
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
