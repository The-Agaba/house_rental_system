import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, Search, LayoutDashboard, LogOut, Menu, X,
  PlusCircle, Sun, Moon, KeyRound
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [isDark,     setIsDark]     = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Detect scroll for shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinks = [
    { name: 'Home',       path: '/',           icon: <Home   size={16} /> },
    { name: 'Properties', path: '/properties', icon: <Search size={16} /> },
  ];

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-shadow duration-300
        bg-white/90 backdrop-blur-xl dark:bg-[#08091a]/90
        border-b border-slate-200/80 dark:border-slate-800/80
        ${scrolled ? 'shadow-md' : ''}`}
    >
      <nav className="container flex items-center justify-between h-18" style={{ height: '72px' }}>

        {/* ── Logo ─────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:scale-105 transition-transform">
            <Home size={20} />
          </div>
          <span className="text-xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
            Rental<span className="text-primary-600">Hub</span>
          </span>
        </Link>

        {/* ── Desktop Nav ───────────────────────────────── */}
        <div className="hidden md:flex items-center gap-8">
          {/* Links */}
          <div className="flex items-center gap-6">
            {navLinks.map(l => (
              <Link
                key={l.path}
                to={l.path}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors py-1 border-b-2 ${
                  isActive(l.path)
                    ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'text-slate-600 border-transparent hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {l.icon} {l.name}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Dark mode */}
            <button
              onClick={toggleDark}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center transition-all shrink-0"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 text-sm font-semibold transition-colors shrink-0 ${isActive('/dashboard') ? 'text-primary-600' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  <LayoutDashboard size={16} /> Dashboard
                </Link>

                {(user.role === 'landlord' || user.role === 'agent') && (
                  <Link to="/properties/new" className="btn-primary !py-2 !px-4 !text-xs shrink-0">
                    <PlusCircle size={14} /> Add Listing
                  </Link>
                )}

                {/* Notifications Bell */}
                <NotificationBell />

                {/* Avatar + name */}
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700 shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold text-sm flex items-center justify-center">
                    {user.fullName?.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user.fullName?.split(' ')[0]}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{user.role}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-all shrink-0"
                  title="Log out"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 shrink-0">
                <Link to="/become-landlord" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-450 transition-all">
                  Become a Landlord
                </Link>
                <Link to="/verify-landlord" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-all">
                  <KeyRound size={14} /> Verify Code
                </Link>
                <Link to="/login"    className="btn-ghost !py-2 !px-4 !text-sm">Log In</Link>
                <Link to="/register" className="btn-primary !py-2 !px-4 !text-sm">Sign Up</Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile burger ─────────────────────────────── */}
        <div className="md:hidden flex items-center gap-2">
          {user && <NotificationBell />}
          <button
            onClick={toggleDark}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ───────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#08091a] overflow-hidden"
          >
            <div className="container py-6 flex flex-col gap-2">
              {navLinks.map(l => (
                <Link
                  key={l.path}
                  to={l.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-colors ${
                    isActive(l.path)
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive(l.path) ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {l.icon}
                  </div>
                  {l.name}
                </Link>
              ))}

              {user && (
                <>
                  <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm ${isActive('/dashboard') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><LayoutDashboard size={16} /></div>
                    Dashboard
                  </Link>
                  {user.role === 'landlord' && (
                    <Link to="/properties/new" className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm text-primary-600 bg-primary-50 dark:bg-primary-900/20">
                      <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600"><PlusCircle size={16} /></div>
                      Add New Listing
                    </Link>
                  )}
                </>
              )}

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 font-bold flex items-center justify-center">{user.fullName?.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user.fullName}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{user.role}</p>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-sm font-bold">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      <Link to="/become-landlord" className="flex items-center justify-center px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                        Become a Landlord
                      </Link>
                      <Link to="/verify-landlord" className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-sm font-bold text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30">
                        <KeyRound size={16} /> Verify Code
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/login"    className="btn-secondary text-sm justify-center !py-3">Log In</Link>
                      <Link to="/register" className="btn-primary  text-sm justify-center !py-3">Sign Up</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
