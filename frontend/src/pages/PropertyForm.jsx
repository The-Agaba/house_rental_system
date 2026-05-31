import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Building2, MapPin, Bed, 
  Image as ImageIcon, X, Plus, Loader2, Save, Sparkles,
  Info, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    pricePerMonth: '',
    rooms: '',
    availability: 'available',
    phone: '',
    contactEmail: ''
  });
  
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const phoneRef = useRef(null);
  const [phoneError, setPhoneError] = useState('');

  const validateForm = () => {
    const errors = {};
    const price = Number(formData.pricePerMonth);
    const rooms = Number(formData.rooms);

    if (formData.pricePerMonth === '' || Number.isNaN(price)) {
      errors.pricePerMonth = 'Monthly rent is required';
    } else if (price < 0) {
      errors.pricePerMonth = 'Monthly rent cannot be negative';
    } else if (price === 0) {
      errors.pricePerMonth = 'Monthly rent must be greater than zero';
    }

    if (formData.rooms === '' || Number.isNaN(rooms)) {
      errors.rooms = 'Number of rooms is required';
    } else if (rooms < 0) {
      errors.rooms = 'Number of rooms cannot be negative';
    } else if (!Number.isInteger(rooms) || rooms === 0) {
      errors.rooms = 'Number of rooms must be a positive whole number';
    }

    setFieldErrors(errors);
    // phone validation
    const cleanedPhone = String(formData.phone || '').replace(/\s+/g, '');
    if (cleanedPhone) {
      if (/\D/.test(cleanedPhone)) {
        errors.phone = 'Phone must contain digits only';
      } else if (!cleanedPhone.startsWith('255')) {
        errors.phone = 'Phone must start with country code 255';
      } else if (cleanedPhone.length !== 12) {
        errors.phone = 'Phone must be 12 digits (e.g., 255677472870)';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [id]);

  useEffect(() => {
    if (!id && user?.role === 'landlord') {
      toast.error('Request a new property from your dashboard so it can be verified first.');
      navigate('/dashboard');
    }
  }, [id, user, navigate]);

  useEffect(() => {
    if (id) {
      const fetchProperty = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`/properties/${id}`);
          setFormData({
            title: res.data.title,
            description: res.data.description,
            location: res.data.location,
            pricePerMonth: res.data.pricePerMonth,
            phone: res.data.phone || '',
            contactEmail: res.data.contactEmail || '',
            rooms: res.data.rooms,
            availability: res.data.availability
          });
          if (res.data.images) {
             setPreviews(res.data.images.map(img => img.filePath));

        useEffect(() => {
          const el = phoneRef.current || document.getElementById('property-phone');
          if (!el) return;
          const onInput = (e) => {
            const v = e.target.value || '';
            const cleaned = v.replace(/\s+/g, '');
            if (/\D/.test(cleaned)) {
              setPhoneError('Phone must contain digits only');
              return;
            }
            if (!cleaned.startsWith('255')) {
              setPhoneError('Phone must start with country code 255');
              return;
            }
            if (cleaned.length !== 12) {
              setPhoneError('Phone must be 12 digits (e.g., 255677472870)');
              return;
            }
            setPhoneError('');
          };
          el.addEventListener('input', onInput);
          return () => el.removeEventListener('input', onInput);
        }, []);
          }
        } catch (err) {
          toast.error('Failed to load listing');
          navigate('/dashboard');
        } finally {
          setLoading(false);
        }
      };
      fetchProperty();
    }
  }, [id, navigate]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024); // 5MB limit
    
    if (validFiles.length < files.length) {
      toast.error('Some files exceed the 5MB limit');
    }

    const newFilesWithPreviews = validFiles.map(file => {
      file.preview = URL.createObjectURL(file);
      return file;
    });

    setImages(prev => [...prev, ...newFilesWithPreviews]);
    setPreviews(prev => [...prev, ...newFilesWithPreviews.map(f => f.preview)]);
  };

  const removeImage = (index) => {
    // If it's a new image (not from server)
    const previewToRemove = previews[index];
    if (previewToRemove.startsWith('blob:')) {
       URL.revokeObjectURL(previewToRemove);
       const imageIndex = images.findIndex(img => img.preview === previewToRemove);
       if (imageIndex > -1) {
          const updatedImages = [...images];
          updatedImages.splice(imageIndex, 1);
          setImages(updatedImages);
       }
    }
    
    const updatedPreviews = [...previews];
    updatedPreviews.splice(index, 1);
    setPreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    setSaving(true);
    try {
      let propertyId = id;
      if (id) {
        await axios.put(`/properties/${id}`, formData);
      } else {
        const res = await axios.post('/properties', formData);
        propertyId = res.data.id;
      }

      if (images.length > 0) {
        const imgData = new FormData();
        images.forEach(img => imgData.append('files', img));
        await axios.post(`/properties/${propertyId}/images`, imgData);
      }

      toast.success(id
        ? (user?.role === 'landlord'
          ? 'Property details submitted. Please wait for an agent or admin to approve it before it goes public.'
          : 'Listing updated successfully!')
        : 'Listing published to marketplace!');
      navigate('/dashboard');
    } catch (err) {
      const apiFields = err.response?.data?.fields;
      if (apiFields) {
        setFieldErrors(apiFields);
        toast.error('Please fix the highlighted fields');
      } else {
        const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.message || 'Failed to save listing';
        toast.error(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Loader2 className="animate-spin text-primary-600" size={40} />
      <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Loading Property Editor...</p>
    </div>
  );

  return (
    <div className="container py-12 md:py-20 max-w-6xl">
      <div className="flex flex-col gap-10">
        {/* Nav */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 font-bold text-slate-500 hover:text-primary-600 transition-colors w-fit group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
            <ArrowLeft size={20} />
          </div>
          Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-950 dark:text-white leading-tight">
               {id ? 'Complete your' : 'Publish a new'} <span className="text-primary-600">Listing.</span>
            </h1>
            <p className="text-slate-500 font-medium">
              {user?.role === 'landlord' && id
                ? 'After saving, this property waits for an agent or admin to approve it before it appears publicly.'
                : 'Capture the attention of tenants with high-quality details and clear visuals.'}
            </p>
          </div>
          <div className="hidden md:flex gap-4 p-5 glass-card rounded-2xl items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Sparkles size={18} className="text-primary-600" /> AI Enhanced Listing Guide
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-10">
          {/* Main Info */}
          <div className="lg:col-span-7 space-y-8">
            <div className="glass-card p-8 md:p-10 space-y-10 border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold flex items-center gap-3 text-slate-950 dark:text-white">
                <Building2 className="text-primary-600" /> Property Blueprint
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Listing Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Minimalist Loft with Skyline Views"
                    className="input-field !rounded-2xl"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Location / City</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600" size={18} />
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Brooklyn, NY"
                        className="input-field !rounded-2xl !pl-12"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Availability</label>
                    <select 
                      className="input-field !rounded-2xl"
                      value={formData.availability}
                      onChange={(e) => setFormData({...formData, availability: e.target.value})}
                    >
                      <option value="available">Live & Available</option>
                      <option value="rented">Rented</option>
                      <option value="unavailable">Hidden / Unavailable</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Phone Number</label>
                    <input
                      ref={phoneRef}
                      id="property-phone"
                      type="text"
                      placeholder="e.g. 255712345678"
                      className="input-field !rounded-2xl"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                    {(phoneError || fieldErrors.phone) && (
                      <p className="mt-2 ml-1 text-xs font-semibold text-rose-600">{phoneError || fieldErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Contact Email</label>
                    <input
                      type="email"
                      placeholder="contact@example.com"
                      className="input-field !rounded-2xl"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Monthly Rent (TZS)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600 text-xs font-extrabold tracking-widest">
                        TZS
                      </span>
                      <input 
                        required
                        type="number"
                        min="1"
                        placeholder="2400"
                        className={`input-field !rounded-2xl !pl-16 ${fieldErrors.pricePerMonth ? '!border-rose-500' : ''}`}
                        value={formData.pricePerMonth}
                        onChange={(e) => {
                          clearFieldError('pricePerMonth');
                          setFormData({...formData, pricePerMonth: e.target.value});
                        }}
                      />
                    </div>
                    {fieldErrors.pricePerMonth && (
                      <p className="mt-2 ml-1 text-xs font-semibold text-rose-600">{fieldErrors.pricePerMonth}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Total Rooms</label>
                    <div className="relative">
                      <Bed className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600" size={18} />
                      <input 
                        required
                        type="number"
                        min="1"
                        step="1"
                        placeholder="3"
                        className={`input-field !rounded-2xl !pl-12 ${fieldErrors.rooms ? '!border-rose-500' : ''}`}
                        value={formData.rooms}
                        onChange={(e) => {
                          clearFieldError('rooms');
                          setFormData({...formData, rooms: e.target.value});
                        }}
                      />
                    </div>
                    {fieldErrors.rooms && (
                      <p className="mt-2 ml-1 text-xs font-semibold text-rose-600">{fieldErrors.rooms}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 md:p-10 border border-slate-100 dark:border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Comprehensive Description</label>
              <textarea 
                required
                rows="10"
                className="input-field !rounded-3xl resize-none py-6 leading-relaxed"
                placeholder="Highlight unique features like private rooftop, smart home tech, or designer kitchen..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Info size={14} /> Descriptions with 500+ characters get 40% more leads.
              </div>
            </div>
          </div>

          {/* Media & Action */}
          <div className="lg:col-span-5 space-y-8">
            <div className="glass-card p-8 md:p-10 border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-slate-950 dark:text-white">
                <ImageIcon className="text-primary-600" /> Visual Showcase
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <AnimatePresence>
                  {previews.map((src, i) => (
                    <motion.div 
                      key={src}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 group shadow-lg"
                    >
                      <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Preview" />
                      <button 
                        type="button" 
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all text-slate-400 hover:text-primary-600 group">
                  <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm">
                    <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Add Media</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              
              <div className="mt-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold mb-3 uppercase tracking-widest text-primary-600 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Submission Protocol:
                </p>
                <ul className="space-y-2">
                  <li className="text-[10px] text-slate-400 font-medium leading-relaxed">• Minimum 3 high-resolution images.</li>
                  <li className="text-[10px] text-slate-400 font-medium leading-relaxed">• Max file size: 5MB per image.</li>
                  <li className="text-[10px] text-slate-400 font-medium leading-relaxed">• Supported: JPG, PNG, WEBP.</li>
                  {user?.role === 'landlord' && (
                    <li className="text-[10px] text-amber-600 dark:text-amber-300 font-bold leading-relaxed">• Saving sends the listing back for approval before it goes public.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                type="submit" 
                disabled={saving}
                className="btn-primary w-full !py-6 text-xl rounded-[2.5rem] shadow-2xl shadow-primary-600/20 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_70%)]" />
                <span className="relative flex items-center justify-center gap-3">
                  {saving ? <Loader2 className="animate-spin" size={28} /> : (
                    <>{id ? 'Update Listing' : 'Publish Property'} <Save size={24} className="group-hover:translate-y-[-2px] transition-transform" /></>
                  )}
                </span>
              </button>
              
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <ShieldCheck size={14} className="text-green-500" /> Identity Verified Publication
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;
