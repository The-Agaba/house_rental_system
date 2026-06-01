import { useState, useEffect, useRef } from 'react';
import { Bell, Check, MailOpen, AlertCircle, Info, Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [markingReadId, setMarkingReadId] = useState(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data);
      const countRes = await axios.get('/notifications/unread-count');
      setUnreadCount(countRes.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // refresh every 15s

    // Click outside handler to close dropdown
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    setMarkingReadId(id);
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (err) {
      console.error('Failed to mark read', err);
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      await axios.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all read', err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'CONFIRMATION_DEADLINE':
        return <AlertCircle className="text-amber-500" size={18} />;
      case 'PROMOTION':
        return <Star className="text-violet-500" size={18} />;
      case 'RESERVATION_ACCEPTED':
      case 'PROPERTY_APPROVED':
        return <Check className="text-emerald-500" size={18} />;
      default:
        return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition-all focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-[#08091a]">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 glass-card shadow-2xl rounded-2xl overflow-hidden z-50 border border-slate-150 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAllRead}
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1 disabled:opacity-70 disabled:cursor-wait"
                >
                  {markingAllRead ? <Loader2 className="animate-spin" size={12} /> : <MailOpen size={12} />}
                  {markingAllRead ? 'Marking...' : 'Mark all read'}
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                  <Bell className="mx-auto mb-3 opacity-30" size={36} />
                  <p className="text-xs font-medium">No notifications yet.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 flex gap-3 transition-all ${
                      !n.read 
                        ? 'bg-primary-50/30 dark:bg-primary-950/10' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/20'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold text-slate-900 dark:text-white truncate ${!n.read ? 'pr-2' : ''}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            disabled={markingReadId === n.id}
                            className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 hover:underline shrink-0 disabled:opacity-70 disabled:cursor-wait inline-flex items-center gap-1"
                            title="Mark as read"
                          >
                            {markingReadId === n.id ? <Loader2 className="animate-spin" size={10} /> : null}
                            {markingReadId === n.id ? 'Marking...' : 'Mark Read'}
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                        {new Date(n.createdAt).toLocaleDateString()} at{' '}
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
