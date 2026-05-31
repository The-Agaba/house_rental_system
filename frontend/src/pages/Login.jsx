import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError || passwordError) return;
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // toast handled in context
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const elEmail = emailRef.current || document.getElementById('login-email');
    const elPass = passwordRef.current || document.getElementById('login-password');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanups = [];
    if (elEmail) {
      const onInput = (e) => {
        const v = (e.target.value || '').trim();
        if (!v) setEmailError('Email is required');
        else if (!emailRegex.test(v)) setEmailError('Invalid email');
        else setEmailError('');
      };
      elEmail.addEventListener('input', onInput);
      cleanups.push(() => elEmail.removeEventListener('input', onInput));
    }
    if (elPass) {
      const onInput = (e) => {
        const v = e.target.value || '';
        if (!v) setPasswordError('Password is required');
        else setPasswordError('');
      };
      elPass.addEventListener('input', onInput);
      cleanups.push(() => elPass.removeEventListener('input', onInput));
    }
    return () => cleanups.forEach(fn => fn());
  }, []);

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-[#08091a]">
      {/* bg glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-400/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex w-14 h-14 rounded-2xl bg-primary-600 text-white items-center justify-center mb-6 shadow-xl shadow-primary-600/20 hover:scale-105 transition-transform">
            <Home size={26} />
          </Link>
          <h1 className="text-3xl font-display font-extrabold text-slate-950 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sign in to continue to your account.</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input
                  id="login-email"
                  ref={emailRef}
                  type="email" required
                  placeholder="name@example.com"
                  className="input-field !pl-11"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                {emailError && <p className="mt-2 text-sm text-rose-600">{emailError}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2 mx-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Password</label>
                <a href="#" className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input
                  id="login-password"
                  ref={passwordRef}
                  type={showPass ? 'text' : 'password'} required
                  placeholder="••••••••"
                  className="input-field !pl-11 !pr-12"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                {passwordError && <p className="mt-2 text-sm text-rose-600">{passwordError}</p>}
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer select-none group ml-1">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                Remember me for 30 days
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit" disabled={submitting}
              className="btn-primary w-full !py-4 text-base group"
            >
              {submitting
                ? <Loader2 className="animate-spin" size={22} />
                : <> Sign In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> </>
              }
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              New to RentalHub?{' '}
              <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Trust line */}
        <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
          🔒 Your data is encrypted and never shared.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
