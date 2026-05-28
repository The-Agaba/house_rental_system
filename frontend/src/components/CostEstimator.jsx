import { DollarSign, ChevronRight } from 'lucide-react';

const CostEstimator = ({ pricePerMonth, durationMonths, onDurationChange }) => {
  const estimatedTotal = pricePerMonth * durationMonths;

  return (
    <div className="space-y-4">
      {/* Duration selector */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">
          Stay Duration (Months)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 3, 6, 12].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onDurationChange(m)}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                durationMonths === m
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {m} {m === 1 ? 'Month' : 'Months'}
            </button>
          ))}
        </div>
        
        {/* Custom duration slide/input */}
        <div className="mt-3 flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="24"
            className="flex-1 accent-primary-600 h-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer"
            value={durationMonths}
            onChange={(e) => onDurationChange(parseInt(e.target.value))}
          />
          <div className="shrink-0 text-xs font-bold text-slate-600 dark:text-slate-400">
            Custom: <span className="font-mono text-slate-900 dark:text-white">{durationMonths} mo</span>
          </div>
        </div>
      </div>

      {/* Cost breakdown card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800 space-y-2">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Monthly rent</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            ${pricePerMonth.toLocaleString()}/mo
          </span>
        </div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium border-b border-dashed border-slate-200 dark:border-slate-850 pb-2">
          <span>Duration</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            x {durationMonths} {durationMonths === 1 ? 'month' : 'months'}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-xs font-bold text-slate-950 dark:text-white">Estimated Total Cost</span>
          <span className="text-lg font-mono font-extrabold text-primary-600 dark:text-primary-400 inline-flex items-center">
            <DollarSign size={18} className="-mr-0.5" /> {estimatedTotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CostEstimator;
