import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import axios from 'axios';

const ReservationCalendar = ({ propertyId, selectedDate, onDateSelected }) => {
  const [earliestDate, setEarliestDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarliestDate = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/reservations/property/${propertyId}/available-dates`);
        setEarliestDate(res.data);
      } catch (err) {
        console.error('Failed to fetch earliest move-in date', err);
        // fallback to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setEarliestDate(tomorrow.toISOString().split('T')[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchEarliestDate();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl bg-slate-100 dark:bg-slate-900/40 text-xs text-slate-400 font-medium">
        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Calculating availability...
      </div>
    );
  }

  const formattedEarliest = earliestDate 
    ? new Date(earliestDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="space-y-3">
      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">
        Choose Move-In Date
      </label>

      {/* Helper Banner */}
      <div className="p-3.5 rounded-xl bg-primary-50/50 dark:bg-primary-950/10 border border-primary-100/50 dark:border-primary-900/20 flex gap-2">
        <Info size={16} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-primary-850 dark:text-primary-300 font-semibold leading-normal">
          Earliest available move-in date based on the current lease schedule is: <span className="font-extrabold text-primary-600 dark:text-primary-400">{formattedEarliest}</span>.
        </p>
      </div>

      {/* Date Input */}
      <div className="relative">
        <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
        <input
          type="date"
          required
          min={earliestDate}
          className="input-field !pl-11 font-medium"
          value={selectedDate}
          onChange={(e) => onDateSelected(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ReservationCalendar;
