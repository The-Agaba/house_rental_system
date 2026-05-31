import { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Search, Building2, ShieldCheck, ArrowRight, Star, CheckCircle2, Bed, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import background from '../assets/background.webm';
import { formatTzs } from '../utils/currency';

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };
const fadeIn = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.8 } } };
const stagger = { show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } };
const scaleOnHover = { whileHover: { scale: 1.05, transition: { duration: 0.2 } }, whileTap: { scale: 0.98 } };

const FeaturedCard = ({ prop, index }) => (
  <motion.div 
    variants={fadeUp}
    custom={index}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
  >
    <Link to={`/properties/${prop.id}`} className="property-card group h-full block">
      <div className="relative h-56 overflow-hidden">
        <motion.img
          src={prop.images?.[0]?.filePath || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=800'}
          alt={prop.title}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-4 left-4"
        >
          <span className={`badge ${prop.availability === 'available' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {prop.availability === 'available' ? '● Available' : '● Rented'}
          </span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-4 left-4 text-white"
        >
          <p className="text-2xl font-extrabold">{formatTzs(prop.pricePerMonth)}</p>
          <p className="text-xs opacity-80 font-medium">per month</p>
        </motion.div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <motion.h3 
          className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors"
          whileHover={{ x: 5 }}
          transition={{ duration: 0.2 }}
        >
          {prop.title}
        </motion.h3>
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm mb-4">
          <MapPin size={14} className="text-primary-500 shrink-0" />
          <span className="line-clamp-1">{prop.location}</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <Bed size={16} className="text-primary-500" />
            <span>{prop.rooms} {prop.rooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
          </div>
          <motion.div 
            whileHover={{ x: 5, backgroundColor: '#2563eb' }}
            className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300"
          >
            <ChevronRight size={16} />
          </motion.div>
        </div>
      </div>
    </Link>
  </motion.div>
);

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [heroVideoLoaded, setHeroVideoLoaded] = useState(false);

  useEffect(() => {
    axios.get('/properties?availability=available')
      .then(res => {
        const data = res.data.content || res.data || [];
        setFeatured(data.slice(0, 3));
        const total = res.data.totalElements || data.length || 0;
        setActiveListingsCount(total);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Animation variants
  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const zoomIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  const pulseAnimation = {
    scale: [1, 1.02, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  };

  const floatAnimation = {
    y: [0, -8, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
  };

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] sm:min-h-0 sm:h-[80vh] lg:h-[85vh] flex items-center justify-center overflow-hidden py-16 sm:py-0">

        {/* BACKGROUND with fade-in */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            onLoadedData={() => setHeroVideoLoaded(true)}
          >
            <source src={background} type="video/webm" />
          </video>
        </motion.div>

        {/* OVERLAY with fade-in */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70"
        />

        {/* CONTENT */}
        <div className="relative z-20 container flex flex-col justify-center items-center text-center px-4">

          {/* badge with bounce */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-xs"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <Star size={13} className="text-amber-400 fill-amber-400" />
            </motion.div>
            Verified property marketplace
          </motion.div>

          {/* title with stagger letters effect */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight"
          >
            The Smarter Way to <br />
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-400"
            >
              Find Home.
            </motion.span>
          </motion.h1>

          {/* subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-6 text-white/80 max-w-xl text-base sm:text-lg"
          >
            Discover verified premium properties. Connect directly with landlords.
          </motion.p>

          {/* buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center px-4 sm:px-0"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/properties" className="bg-white text-black px-8 py-3.5 rounded-xl font-bold text-center hover:bg-slate-100 transition-colors shadow-lg block">
                Browse Properties
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/properties/new" className="border border-white/30 text-white px-8 py-3.5 rounded-xl text-center hover:bg-white/10 transition-colors block">
                List Property
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/about" className="border border-white/30 text-white px-8 py-3.5 rounded-xl text-center hover:bg-white/10 transition-colors block">
                About Us
              </Link>
            </motion.div>
          </motion.div>

          {/* STATS CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 sm:mt-16 w-full max-w-md sm:max-w-xl"
          >
            <motion.div 
              whileHover={{ y: -5 }}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5 sm:px-8 sm:py-5 grid grid-cols-3 divide-x divide-white/10 text-white shadow-2xl"
            >
              {[
                { v: activeListingsCount > 0 ? `${activeListingsCount}` : "0", l: "Active Listings" },
                { v: `${featured.length}`, l: "Featured Homes" },
                { v: activeListingsCount > 0 ? "Live" : "New", l: "Marketplace" }
              ].map((s, idx) => (
                <motion.div 
                  key={s.l} 
                  className={`text-center ${idx > 0 ? 'pl-2 sm:pl-4' : ''} ${idx < 2 ? 'pr-2 sm:pr-4' : ''}`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-lg sm:text-2xl font-extrabold tracking-tight">{s.v}</div>
                  <div className="text-[9px] sm:text-xs text-white/60 uppercase tracking-wider mt-1">{s.l}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

        </div>

      </section>

      {/* ── Features Section ─────────────────────────────────────── */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={zoomIn}
        className="section bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800"
      >
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={slideInLeft}>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-4"
              >
                Why RentalHub
              </motion.p>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl font-bold mb-8 text-slate-950 dark:text-white leading-tight"
              >
                Built for the<br />Modern Renter.
              </motion.h2>
              <motion.div 
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="space-y-8"
              >
                {[
                  { Icon: Search,       title: 'Intelligent Search',    desc: 'Advanced filters help you pinpoint properties matching your exact lifestyle and budget.' },
                  { Icon: ShieldCheck,  title: 'Fully Verified',        desc: 'Every listing and landlord goes through our rigorous verification process for your peace of mind.' },
                  { Icon: Building2,    title: 'Complete Management',   desc: 'Manage your entire rental journey — from inquiry to monthly payments — in one seamless hub.' },
                ].map(({ Icon, title, desc }, idx) => (
                  <motion.div 
                    key={title} 
                    variants={fadeUp}
                    whileHover={{ x: 10, transition: { duration: 0.2 } }}
                    className="flex gap-5 group cursor-pointer"
                  >
                    <motion.div 
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center shrink-0 mt-1"
                    >
                      <Icon size={22} />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold mb-1.5 text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">{title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div 
              variants={slideInRight}
              className="relative"
            >
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl overflow-hidden shadow-2xl"
              >
                <motion.img
                  src="https://i.pinimg.com/1200x/5e/d8/15/5ed8155fc6fe355d7148261f1e9d37cf.jpg"
                  alt="Interior"
                  className="w-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>
              <motion.div 
                animate={floatAnimation}
                className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary-500 rounded-full blur-3xl opacity-20"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── Featured Properties ───────────────────────────── */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="section"
      >
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <motion.p 
                variants={fadeUp}
                className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-3"
              >
                Hand-Picked
              </motion.p>
              <motion.h2 
                variants={fadeUp}
                className="text-4xl font-bold text-slate-950 dark:text-white"
              >
                Featured Listings
              </motion.h2>
            </div>
            <motion.div 
              variants={fadeUp}
              whileHover={{ x: 5 }}
            >
              <Link to="/properties" className="btn-secondary !py-2.5 !px-5 text-sm self-start sm:self-auto inline-flex items-center gap-2">
                View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-4 border-primary-500/20 border-t-primary-600"
              />
              <p className="mt-4 text-slate-400 text-sm">Loading featured listings...</p>
            </motion.div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {featured.map((prop, i) => (
                <FeaturedCard key={prop.id} prop={prop} index={i} />
              ))}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* ── CTA Section ──────────────────────────────────────────── */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={zoomIn}
        className="section container"
      >
        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
          className="bg-primary-600 rounded-4xl sm:rounded-5xl p-10 sm:p-16 md:p-24 text-center relative overflow-hidden"
        >
          {/* Animated background */}
          <motion.div 
            animate={pulseAnimation}
            aria-hidden 
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/5 blur-3xl"
          />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.h2 
              variants={fadeUp}
              className="text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight"
            >
              Ready to find your <br className="hidden sm:block" /> dream space?
            </motion.h2>
            <motion.p 
              variants={fadeUp}
              className="text-primary-100 text-lg mb-10 leading-relaxed"
            >
              Join thousands of happy tenants and discover the place you've always wanted.
            </motion.p>
            <motion.div 
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.div variants={fadeUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/register" className="bg-white text-primary-600 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-primary-50 transition-colors shadow-xl w-full sm:w-auto inline-block">
                  Get Started Free
                </Link>
              </motion.div>
              <motion.div variants={fadeUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/properties" className="bg-primary-700 text-white border border-primary-500 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-primary-800 transition-colors w-full sm:w-auto inline-block">
                  Browse Houses
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

    </div>
  );
};

export default Home;