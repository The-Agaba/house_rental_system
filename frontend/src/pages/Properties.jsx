import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Bed, Banknote, Filter, SlidersHorizontal,
  Loader2, ChevronRight, LayoutGrid, List as ListIcon, X, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTzs } from '../utils/currency';


/* ── Skeleton ──────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="card animate-pulse">
    <div className="h-56 bg-slate-200 dark:bg-slate-800" />
    <div className="p-6 space-y-3">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/5" />
      </div>
    </div>
  </div>
);

/* ── Property Card (Grid) ─────────────────────────────────── */
const GridCard = ({ prop, i }) => (
  <motion.div
    key={prop.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: i * 0.05 }}
  >
    <Link to={`/properties/${prop.id}`} className="property-card group h-full block">
      <div className="relative h-56 overflow-hidden">
        <img
          src={prop.images?.[0]?.filePath || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=800'}
          alt={prop.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3">
          <span className={`badge shadow-lg backdrop-blur-md ${prop.availability === 'available' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
            {prop.availability === 'available' ? '● Available' : '● Rented'}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1 flex-1">{prop.title}</h3>
          <div className="text-right shrink-0">
            <p className="font-extrabold text-slate-900 dark:text-white">{formatTzs(prop.pricePerMonth)}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/mo</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm mb-4">
          <MapPin size={13} className="text-primary-500 shrink-0" />
          <span className="line-clamp-1">{prop.location}</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <Bed size={16} className="text-primary-500" />
            <span>{prop.rooms} {prop.rooms === 1 ? 'Bed' : 'Beds'}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

/* ── Property Card (List) ─────────────────────────────────── */
const ListCard = ({ prop, i }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: i * 0.04 }}
  >
    <Link to={`/properties/${prop.id}`} className="card flex flex-col sm:flex-row hover:border-primary-400/40 hover:shadow-premium-hover transition-all duration-300 group">
      <div className="relative w-full sm:w-64 h-52 sm:h-auto overflow-hidden shrink-0">
        <img
          src={prop.images?.[0]?.filePath || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=400'}
          alt={prop.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3">
          <span className={`badge ${prop.availability === 'available' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
            {prop.availability === 'available' ? '● Available' : '● Rented'}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 mb-3">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">{prop.title}</h3>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{formatTzs(prop.pricePerMonth)}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/month</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-4">
          <MapPin size={14} className="text-primary-500 shrink-0" />
          {prop.location}
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed">{prop.description}</p>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <Bed size={16} className="text-primary-500" /> {prop.rooms} Bedrooms
          </div>
          <span className="btn-primary !py-2 !px-5 text-sm">
            View Details <ChevronRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  </motion.div>
);

/* ── Main Page ─────────────────────────────────────────────── */
const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ location: '', maxPrice: '', minRooms: '', availability: '' });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const applyFilters = (list, f) =>
    list.filter(p => {
      if (f.location && !p.location.toLowerCase().includes(f.location.toLowerCase())) return false;
      if (f.maxPrice && p.pricePerMonth > Number(f.maxPrice)) return false;
      if (f.minRooms && p.rooms < Number(f.minRooms)) return false;
      if (f.availability && p.availability !== f.availability) return false;
      return true;
    });

  const countActive = (f) => Object.values(f).filter(v => v !== '').length;

  const fetchProperties = async (f = filters) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
      const res = await axios.get('/properties', { params, timeout: 4000 });
      setProperties(res.data.content || res.data || []);
    } catch (err) {
      // Backend offline
      setProperties([]);
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveFiltersCount(countActive(filters));
    fetchProperties(filters);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    const empty = { location: '', maxPrice: '', minRooms: '', availability: '' };
    setFilters(empty);
    setActiveFiltersCount(0);
    fetchProperties(empty);
  };

  return (
    <div className="container py-10 md:py-16">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-2">Browse</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 dark:text-white">
            Explore <span className="text-primary-600">Premium Space.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            {loading ? 'Loading...' : `${properties.length} listing${properties.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter toggle */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl border font-semibold text-sm transition-all ${
              filterOpen || activeFiltersCount > 0
                ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-500'
            }`}
          >
            <SlidersHorizontal size={17} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-primary-600 text-[10px] font-bold flex items-center justify-center shadow-md border-2 border-primary-600">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown size={15} className={`transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Collapsible Filter Panel ──────────────────────── */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 40 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSearch} className="glass-card p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-5 items-end">
                {/* Location */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
                    <input
                      type="text" placeholder="City or neighborhood"
                      className="input-field !pl-10"
                      value={filters.location}
                      onChange={e => setFilters({ ...filters, location: e.target.value })}
                    />
                  </div>
                </div>

                {/* Max Price */}
                <div className="w-full sm:w-44">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Max Price / mo (TZS)</label>
                    <div className="relative">
                    <Banknote className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
                    <input
                      type="number" placeholder="Any"
                      className="input-field !pl-10"
                      value={filters.maxPrice}
                      onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
                    />
                  </div>
                </div>

                {/* Min Beds */}
                <div className="w-full sm:w-36">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Min Beds</label>
                  <div className="relative">
                    <Bed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
                    <input
                      type="number" placeholder="Any" min="1"
                      className="input-field !pl-10"
                      value={filters.minRooms}
                      onChange={e => setFilters({ ...filters, minRooms: e.target.value })}
                    />
                  </div>
                </div>

                {/* Availability */}
                <div className="w-full sm:w-44">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                  <select
                    className="input-field"
                    value={filters.availability}
                    onChange={e => setFilters({ ...filters, availability: e.target.value })}
                  >
                    <option value="">All Properties</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Rented</option>
                  </select>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 w-full sm:w-auto">
                  {activeFiltersCount > 0 && (
                    <button type="button" onClick={clearFilters} className="btn-secondary !py-3 flex-1 sm:flex-none gap-1.5">
                      <X size={15} /> Clear
                    </button>
                  )}
                  <button type="submit" className="btn-primary !py-3 flex-1 sm:flex-none">
                    <Filter size={16} /> Apply
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ──────────────────────────────────────── */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-6'}>
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="glass-card py-24 px-8 text-center rounded-4xl">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
            <Search size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No listings found</h3>
          <p className="text-slate-500 max-w-sm mx-auto text-sm mb-8">We couldn't find any properties matching your filters. Try broadening your search.</p>
          <button onClick={clearFilters} className="btn-secondary">Clear All Filters</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((p, i) => <GridCard key={p.id} prop={p} i={i} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {properties.map((p, i) => <ListCard key={p.id} prop={p} i={i} />)}
        </div>
      )}
    </div>
  );
};

export default Properties;
