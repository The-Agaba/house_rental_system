import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, User, Landmark, Building, MapPin, Plus, Trash, ArrowRight, CheckCircle, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const LandlordJoinRequest = () => {
  const [form, setForm] = useState({
    requesterEmail: '',
    requesterFullName: '',
    requesterPhone: '',
    locality: '',
    tinNumber: '',
    properties: [{ title: '', location: '' }]
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const errorMessages = {
    email_taken: 'This email is already registered. Please log in instead, or use another email for the landlord request.',
    pending_request_exists: 'A landlord request already exists for this email and is still being reviewed.',
    property_claim_required: 'Add at least one property name and location before submitting.',
    validation_failed: 'Please check the highlighted details and try again.',
    unexpected_error: 'Something went wrong while submitting. Please try again in a moment.'
  };

  const getErrorMessage = (err) => {
    const data = err.response?.data;
    const key = data?.error || data?.message;
    return errorMessages[key] || key || 'Failed to submit application. Please try again.';
  };

  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
  };

  const handlePropertyChange = (index, field, val) => {
    const props = [...form.properties];
    props[index][field] = val;
    setForm(f => ({ ...f, properties: props }));
  };

  const addProperty = () => {
    setForm(f => ({
      ...f,
      properties: [...f.properties, { title: '', location: '' }]
    }));
  };

  const removeProperty = (index) => {
    if (form.properties.length === 1) return;
    const props = form.properties.filter((_, i) => i !== index);
    setForm(f => ({ ...f, properties: props }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.properties.some(p => !p.title.trim() || !p.location.trim())) {
      toast.error('Please fill in details for all proposed properties.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/landlord-requests', form);
      setSuccess(true);
      toast.success('Join request submitted successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-[#08091a]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl text-center glass-card p-10 shadow-2xl"
        >
          <div className="inline-flex w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 items-center justify-center mb-6">
            <CheckCircle size={36} />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-slate-950 dark:text-white mb-4">Application Submitted!</h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed mb-8">
            Thank you for applying to RentHub. Your request has been successfully submitted.
            A verified RentHub agent in your locality (<span className="font-bold text-primary-600 dark:text-primary-400">{form.locality}</span>) will contact you shortly to arrange a physical document verification (proof of property ownership and TRA TIN verification).
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/" className="btn-primary w-full sm:w-auto !py-3">
              Return Home
            </Link>
            <Link to="/login" className="btn-secondary w-full sm:w-auto !py-3">
              Go to Login Page
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-[#08091a]">
      {/* Background glow effects */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-primary-400/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[110px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex w-14 h-14 rounded-2xl bg-primary-600 text-white items-center justify-center mb-6 shadow-xl shadow-primary-600/20 hover:scale-105 transition-transform">
            <Home size={26} />
          </Link>
          <h1 className="text-3xl font-display font-extrabold text-slate-950 dark:text-white mb-2">Apply as Landlord</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Join the RentHub platform community and rent your properties safely.</p>
        </div>

        <div className="glass-card p-8 sm:p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Step 1: Personal / Legal info */}
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                1. Personal &amp; Legal Details
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text" required
                      placeholder="Enter full legal name"
                      className="input-field !pl-11"
                      value={form.requesterFullName}
                      onChange={(e) => setField('requesterFullName', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email" required
                      placeholder="email@example.com"
                      className="input-field !pl-11"
                      value={form.requesterEmail}
                      onChange={(e) => setField('requesterEmail', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="tel" required
                      placeholder="e.g. +255 712 345 678"
                      className="input-field !pl-11"
                      value={form.requesterPhone}
                      onChange={(e) => setField('requesterPhone', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">Locality / City Area</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text" required
                      placeholder="e.g. Dar es Salaam - Kinondoni"
                      className="input-field !pl-11"
                      value={form.locality}
                      onChange={(e) => setField('locality', e.target.value)}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 ml-1">TRA TIN Number</label>
                  <div className="relative">
                    <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text" required
                      placeholder="9-digit TRA Taxpayer Identification Number"
                      className="input-field !pl-11"
                      value={form.tinNumber}
                      onChange={(e) => setField('tinNumber', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Properties to register */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  2. Proposed Properties
                </h2>
                <button
                  type="button"
                  onClick={addProperty}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  <Plus size={14} /> Add Property
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {form.properties.map((prop, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 ml-1">Property Name / Title</label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                              type="text" required
                              placeholder="e.g. Kinondoni Luxury Apartment"
                              className="input-field !pl-9 !py-2 text-sm"
                              value={prop.title}
                              onChange={(e) => handlePropertyChange(idx, 'title', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 ml-1">Exact Location / Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                              type="text" required
                              placeholder="e.g. Plot 43, Mwai Kibaki Road"
                              className="input-field !pl-9 !py-2 text-sm"
                              value={prop.location}
                              onChange={(e) => handlePropertyChange(idx, 'location', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {form.properties.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProperty(idx)}
                          className="mt-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-lg transition-all"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Note */}
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100/70 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed font-medium">
              <strong>Verification note:</strong> Your submitted TRA TIN and property ownership titles must match your physical documents. Each claimed property will stay hidden until you complete its listing details and an agent approves it.
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={submitting}
              className="btn-primary w-full !py-4 text-base group"
            >
              {submitting
                ? 'Submitting Application...'
                : <> Submit Join Request <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> </>
              }
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LandlordJoinRequest;
