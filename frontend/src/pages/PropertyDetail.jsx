import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Bed, Banknote, ShieldCheck, ChevronLeft,
  Star, CheckCircle2, Shield, Share2, Heart,
  Maximize2, Loader2, Wifi, Car, Trees, Wind, ListOrdered
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ReservationQueue from '../components/ReservationQueue';
import ReservationCalendar from '../components/ReservationCalendar';
import CostEstimator from '../components/CostEstimator';
import { formatTzs } from '../utils/currency';

const AMENITIES = [
  { icon: Wifi,         label: 'High-Speed Fiber' },
  { icon: Car,          label: 'Private Parking'  },
  { icon: Trees,        label: 'Garden / Terrace' },
  { icon: Wind,         label: 'Air Conditioning' },
  { icon: Shield,       label: '24/7 Security'    },
  { icon: CheckCircle2, label: 'Pet Friendly'      },
];

const PropertyDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [property, setProperty] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [sending,  setSending]  = useState(false);
  const [liked,    setLiked]    = useState(false);

  const [moveInDate, setMoveInDate] = useState('');
  const [durationMonths, setDurationMonths] = useState(3);
  const [queueRefreshKey, setQueueRefreshKey] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`/properties/${id}`, { timeout: 4000 });
        setProperty(res.data);
      } catch {
        toast.error('Property not found'); navigate('/properties');
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleJoinQueue = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please log in to join the reservation queue'); navigate('/login'); return; }
    if (user.role !== 'tenant') { toast.error('Only tenant accounts can reserve properties'); return; }
    if (!moveInDate) { toast.error('Please choose a move-in date'); return; }
    setSending(true);
    try {
      await axios.post('/reservations', { 
        propertyId: property.id, 
        moveInDate,
        durationMonths
      });
      toast.success('You joined the reservation queue');
      setMoveInDate('');
      setQueueRefreshKey(prev => prev + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to join queue');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-primary-600" size={40} />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Property...</p>
    </div>
  );

  if (!property) return null;

  const images = property.images?.length
    ? property.images.map(i => i.filePath)
    : [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1400',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1400',
        'https://images.unsplash.com/photo-1600607687940-4e7a6a953c1b?auto=format&fit=crop&q=80&w=1400',
      ];

  return (
    <div className="container py-8 md:py-12">

      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <button
          onClick={() => navigate('/properties')}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors group"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary-50">
            <ChevronLeft size={20} />
          </div>
          <span className="hidden sm:inline">Back to Listings</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all ${liked ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary-600 flex items-center justify-center transition-all">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 items-start">

        {/* ── LEFT: Gallery + Details ───────────────────── */}
        <div className="lg:col-span-8 space-y-10">

          {/* Gallery */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-[16/9]"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  src={images[activeImg]}
                  className="w-full h-full object-cover"
                  alt={property.title}
                />
              </AnimatePresence>

              <div className="absolute top-4 left-4">
                <span className={`badge px-4 py-2 backdrop-blur-md shadow-xl ${property.availability === 'available' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                  {property.availability === 'available' ? '● Available' : '● Rented'}
                </span>
              </div>
              <button className="absolute bottom-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all">
                <Maximize2 size={18} />
              </button>
            </motion.div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-1 no-scrollbar">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImg === i ? 'border-primary-600 shadow-lg' : 'border-transparent opacity-60 hover:opacity-90'}`}
                  >
                    <img src={src} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Meta */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white leading-tight flex-1">
                {property.title}
              </h1>
              <div className="text-right shrink-0">
                <p className="text-3xl font-extrabold text-primary-600">{formatTzs(property.pricePerMonth)}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">per month</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-8">
              <MapPin size={18} className="text-primary-500 shrink-0" />
              <span className="text-lg font-medium">{property.location}</span>
            </div>

            {/* Stats chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-y border-slate-100 dark:border-slate-800">
              {[
                { label: 'Bedrooms',   value: property.rooms,   icon: Bed         },
                { label: 'Monthly',    value: formatTzs(property.pricePerMonth), icon: Banknote },
                { label: 'Queue',      value: property.bookingCount || 0, icon: ListOrdered },
                { label: 'Rating',     value: '4.9 / 5',        icon: Star        },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="card p-4 text-center">
                  <Icon size={20} className="text-primary-500 mx-auto mb-2" />
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white">{value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="card p-6 md:p-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <Shield size={20} className="text-primary-500" /> About this Property
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {property.description || 'No description provided for this listing.'}
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {AMENITIES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <Icon size={18} className="text-primary-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Contact sidebar ────────────────────── */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-7"
            >
              <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Reserve This Home</h3>

              {/* Landlord badge */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white text-xl font-extrabold flex items-center justify-center shadow-lg shadow-primary-600/20 shrink-0">
                  <ShieldCheck size={26} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Verified Partner</p>
                    <ShieldCheck size={14} className="text-primary-500 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Contact details stay private until your reservation is accepted.
                  </p>
                </div>
              </div>

              {!user ? (
                <div className="text-center py-6">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">Please log in as a tenant to join the reservation queue.</p>
                  <Link to="/login" className="btn-primary w-full !py-3">Login to Reserve</Link>
                </div>
              ) : (
                <>
                  <form onSubmit={handleJoinQueue} className="space-y-5">
                    <ReservationCalendar
                      propertyId={property.id}
                      selectedDate={moveInDate}
                      onDateSelected={setMoveInDate}
                    />
                    <CostEstimator
                      pricePerMonth={Number(property.pricePerMonth || 0)}
                      durationMonths={durationMonths}
                      onDurationChange={setDurationMonths}
                    />

                    <button type="submit" disabled={sending} className="btn-primary w-full !py-4 text-base group">
                      {sending
                        ? <Loader2 className="animate-spin" size={20} />
                        : <><ListOrdered size={18} /> Join Queue</>
                      }
                    </button>
                  </form>

                  <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <ShieldCheck size={13} className="text-green-500" /> FCFS queue with 24-hour confirmation
                  </div>
                </>
              )}
            </motion.div>

            {user && (
              <div className="card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                <ReservationQueue
                  key={queueRefreshKey}
                  propertyId={property.id}
                  onQueueUpdated={() => setQueueRefreshKey(prev => prev + 1)}
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PropertyDetail;
