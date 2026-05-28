import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, Lock, Loader2, ArrowRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const LandlordEmailVerify = () => {
  const [form, setForm] = useState({ email: '', code: '', newPassword: '' });
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.code || !form.newPassword) return;

    if (form.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setVerifying(true);
    try {
      await axios.post('/landlord-requests/verify-and-activate', form);
      toast.success('Account activated and password updated successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data || 'Verification failed. Please check your details and try again.';
      toast.error(typeof msg === 'string' ? msg : 'Invalid verification code or details.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-[#08091a]">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-primary-400/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[110px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex w-14 h-14 rounded-2xl bg-primary-600 text-white items-center justify-center mb-6 shadow-xl shadow-primary-600/20 hover:scale-105 transition-transform">
            <Home size={26} />
          </Link>
          <h1 className="text-3xl font-display font-extrabold text-slate-950 dark:text-white mb-2">Activate Account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Verify email and choose your password to get started.</p>
        </div>

        <div className="glass-card p-8 sm:p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email" required
                  placeholder="name@example.com"
                  className="input-field !pl-11"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">6-Digit Verification Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text" required maxLength={6}
                  placeholder="Enter 6-digit OTP code"
                  className="input-field !pl-11 text-center font-mono tracking-widest text-lg font-bold"
                  value={form.code}
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">Set New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password" required minLength={6}
                  placeholder="Create your password (min. 6 chars)"
                  className="input-field !pl-11"
                  value={form.newPassword}
                  onChange={(e) => setForm(f => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
            </div>

            <button
              type="submit" disabled={verifying}
              className="btn-primary w-full !py-4 text-base group"
            >
              {verifying
                ? <Loader2 className="animate-spin" size={22} />
                : <> Verify &amp; Activate Account <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> </>
              }
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Back to{' '}
              <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LandlordEmailVerify;
