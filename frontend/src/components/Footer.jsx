import { Home, Mail, Phone, MapPin, Instagram, Twitter, Facebook, Book } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pt-16 pb-8 mt-auto">
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center">
              <Home size={22} />
            </div>
            <span className="text-xl font-display font-extrabold text-slate-950 dark:text-white">
              Rental<span className="text-primary-600">Hub</span>
            </span>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 max-w-xs">
            Connecting renters with their dream spaces. The most trusted platform for premium property listings.
          </p>
          <div className="flex gap-3">
            {[
              { Icon: Instagram, href: 'https://instagram.com' },
              { Icon: Twitter,   href: 'https://twitter.com'   },
              { Icon: Facebook,  href: 'https://facebook.com'  },
            ].map(({ Icon, href }, i) => (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all">
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-5">Platform</h4>
          <ul className="space-y-3.5">
            {[
              { label: 'Search Houses',    to: '/properties' },
              { label: 'List a Property',  to: '/register'   },
              { label: 'Dashboard',        to: '/dashboard'  },
              { label: 'Pricing',          to: '/properties' },
            ].map(({ label, to }) => (
              <li key={label}>
                <Link to={to} className="text-sm font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-5">Support</h4>
          <ul className="space-y-3.5">
            <li>
              <Link to="/manual" className="text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-350 transition-colors flex items-center gap-1.5">
                <Book size={14} className="shrink-0" /> User Manual
              </Link>
            </li>
            {[
              { label: 'FAQ',          to: '/manual#welcome' },
              { label: 'Contact Us',   to: '/manual#admin' },
              { label: 'Report Issue', to: '/manual#tenant' },
            ].map(({ label, to }) => (
              <li key={label}>
                <Link to={to} className="text-sm font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-5">Contact</h4>
          <ul className="space-y-4">
            {[
              { Icon: MapPin, text: 'Dodoma, Tanzania P.O.BOX 7000', href: 'https://maps.google.com/?q=Dodoma,Tanzania' },
              { Icon: Phone,  text: '+255767113665',                 href: 'tel:+255767113665' },
              { Icon: Mail,   text: 'support@rentalhub.com',         href: 'mailto:support@rentalhub.com' },
            ].map(({ Icon, text, href }) => (
              <li key={text}>
                <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-start gap-3 text-sm text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors">
                  <Icon size={16} className="text-primary-500 mt-0.5 shrink-0" />
                  <span>{text}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs font-medium text-slate-400">
          &copy; {new Date().getFullYear()} RentalHub. All rights reserved.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { label: 'Privacy Policy',   to: '/manual' },
            { label: 'Terms of Service', to: '/manual' },
          ].map(({ label, to }) => (
            <Link key={label} to={to} className="text-xs font-medium text-slate-400 hover:text-primary-600 transition-colors">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
