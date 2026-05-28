import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Loader2, ArrowRight, Home, Building2, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import OtpModal from '../components/OtpModal';

const Register = () => {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'tenant' });
  const [submitting, setSubmitting] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      // Registration queued successfully — show OTP modal
      setShowOtp(true);
    } catch {
      // toast handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-[#08091a]">
      {/* bg glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-primary-400/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[40%] rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex w-14 h-14 rounded-2xl bg-primary-600 text-white items-center justify-center mb-6 shadow-xl shadow-primary-600/20 hover:scale-105 transition-transform">
            <Home size={26} />
          </Link>
          <h1 className="text-3xl font-display font-extrabold text-slate-950 dark:text-white mb-2">Create Account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Join thousands of users on RentalHub today.</p>
        </div>

        <div className="glass-card p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Name + Email grid */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  <input
                    type="text" required
                    placeholder="John Doe"
                    className="input-field !pl-11"
                    value={form.fullName}
                    onChange={set('fullName')}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  <input
                    type="email" required
                    placeholder="name@example.com"
                    className="input-field !pl-11"
                    value={form.email}
                    onChange={set('email')}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="password" required minLength={6}
                  placeholder="Create a strong password (min. 6 chars)"
                  className="input-field !pl-11"
                  value={form.password}
                  onChange={set('password')}
                />
              </div>
            </div>

            {/* Landlord application CTA banner */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-center">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-bold">
                Are you a landlord looking to rent out property?
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                Landlords are registered via local agents after verification.
              </p>
              <Link to="/become-landlord" className="inline-flex items-center gap-1 text-xs font-extrabold text-primary-600 dark:text-primary-400 hover:underline mt-3">
                Apply to join RentHub as a Landlord <ArrowRight size={14} />
              </Link>
            </div>

            {/* Terms notice */}
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-primary-600 font-semibold hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary-600 font-semibold hover:underline">Privacy Policy</a>.
            </p>

            {/* Submit */}
            <button
              type="submit" disabled={submitting}
              className="btn-primary w-full !py-4 text-base group"
            >
              {submitting
                ? <Loader2 className="animate-spin" size={22} />
                : <> Create My Account <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> </>
              }
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* OTP Modal — rendered outside the form card, inside the page */}
      <OtpModal
        isOpen={showOtp}
        email={form.email}
        onClose={() => setShowOtp(false)}
      />
    </div>
  );
};

export default Register;