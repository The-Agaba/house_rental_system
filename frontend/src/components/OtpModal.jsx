import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, X, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const OtpModal = ({ isOpen, email, onClose }) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef([]);
  const [otpError, setOtpError] = useState('');
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  // Real-time validation via native `input` events
  useEffect(() => {
    const handlers = [];
    inputRefs.current.forEach((el, idx) => {
      if (!el) return;
      const onInput = (e) => {
        const cleaned = e.target.value.replace(/\D/g, '');
        if (e.target.value !== cleaned) {
          setOtpError('Only numeric digits allowed');
        } else {
          setOtpError('');
        }
      };
      el.addEventListener('input', onInput);
      handlers.push({ el, onInput });
    });

    return () => {
      handlers.forEach(({ el, onInput }) => el.removeEventListener('input', onInput));
    };
  }, [isOpen]);

  const handleChange = (index, value) => {
    // Accept only single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((char, i) => { next[i] = char; });
    setDigits(next);
    // Focus last filled or last box
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async () => {
    const code = digits.join('');
    if (code.length < 6) return;
    setSubmitting(true);
    try {
      await verifyEmail(email, code);
      // Verification succeeded — send user to login manually
      navigate('/login');
    } catch {
      // toast already shown in context; reset digits so user can retry
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const codeComplete = digits.every(d => d !== '');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            // Stop click inside modal from closing it
            onClick={e => e.stopPropagation()}
          >
            <div className="glass-card w-full max-w-md p-8 sm:p-10 relative">

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Icon + heading */}
              <div className="text-center mb-8">
                <div className="inline-flex w-16 h-16 rounded-2xl bg-primary-600 text-white items-center justify-center mb-5 shadow-xl shadow-primary-600/20">
                  <ShieldCheck size={30} />
                </div>
                <h2 className="text-2xl font-display font-extrabold text-slate-950 dark:text-white mb-2">
                  Verify Your Email
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  We sent a 6-digit code to
                </p>
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                  <Mail size={13} className="text-primary-600 dark:text-primary-400" />
                  <span className="text-xs font-bold text-primary-700 dark:text-primary-400">{email}</span>
                </div>
              </div>

              {/* OTP inputs */}
              <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-11 h-14 text-center text-xl font-bold rounded-2xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                      focus:outline-none transition-all
                      ${digit
                        ? 'border-primary-500 ring-2 ring-primary-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                      }`}
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-center text-sm text-red-600 mb-4">{otpError}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!codeComplete || submitting}
                className="btn-primary w-full !py-4 text-base"
              >
                {submitting
                  ? <Loader2 className="animate-spin" size={22} />
                  : 'Verify & Continue'
                }
              </button>

              <p className="text-center text-xs text-slate-400 mt-5 leading-relaxed">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  type="button"
                  className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                  onClick={onClose}
                >
                  go back and register again
                </button>.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OtpModal;