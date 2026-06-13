import { useEffect, useMemo, useState } from 'react';
import { Clock, HelpCircle, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const formatStatus = (status) => (status || 'available').replaceAll('_', ' ');

const ReservationQueue = ({ propertyId }) => {
  const [status, setStatus] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`/reservations/property/${propertyId}/queue`);
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch reservation status', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [propertyId]);

  const expiresLabel = useMemo(() => {
    if (!status?.reservationExpiresAt) return null;
    return new Date(status.reservationExpiresAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [status?.reservationExpiresAt]);

  if (!status) {
    return <div className="text-xs text-slate-400">Loading reservation status...</div>;
  }

  if (!status.reserved) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500">
        <HelpCircle className="mx-auto mb-2 opacity-30" size={28} />
        <p className="text-xs font-medium">This property is open for a tenant reservation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/10 border border-amber-100/70 dark:border-amber-900/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
              Property Reserved
            </p>
            <p className="text-[12px] text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
              A tenant has an active 24-hour reservation hold. Personal tenant details are private.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white capitalize">{formatStatus(status.status)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hold Expires</p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{expiresLabel || 'Pending'}</p>
        </div>
      </div>

      {status.appointmentConfirmed && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <ShieldCheck size={16} />
          Landlord has confirmed the viewing appointment.
        </div>
      )}
    </div>
  );
};

export default ReservationQueue;
