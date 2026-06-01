import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Book, ChevronRight, Home, Printer, Shield, 
  MapPin, Clock, ArrowLeft, ArrowUpRight, Bed,
  Info, CheckCircle2, ShieldCheck, Mail, Phone, Users, ShieldAlert,
  Menu, X, Sparkles
} from 'lucide-react';

const Manual = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('welcome');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sections = [
    { id: 'welcome', label: 'Getting Started' },
    { id: 'tenant', label: 'For Tenants' },
    { id: 'landlord', label: 'For Landlords' },
    { id: 'admin', label: 'For Administrators' },
    { id: 'faq', label: 'Common Questions' },
    { id: 'support', label: 'Contact Support' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#08091a] text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300">
      {/* Dynamic Print CSS */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-container {
            margin: 0 !important;
            padding: 20px !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #000 !important;
            page-break-after: avoid;
          }
          pre, code, blockquote, tr, img, .card {
            page-break-inside: avoid;
          }
          a {
            color: #000 !important;
            text-decoration: underline !important;
          }
        }
      `}</style>

      {/* ── TOP HEADER (NO-PRINT) ── */}
      <header className="no-print sticky top-0 z-40 bg-white/80 dark:bg-[#08091a]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Home size={18} />
          </Link>
          <div>
            <span className="font-display font-black tracking-tight text-slate-900 dark:text-white text-base block">RentalHub User Manual</span>
            <span className="text-[9px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest block -mt-1 font-display">Complete User Guide</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <Printer size={14} /> Print / Save PDF
          </button>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <div className="flex relative">
        
        {/* ── SIDEBAR TABLE OF CONTENTS (NO-PRINT) ── */}
        <aside className={`no-print w-64 border-r border-slate-100 dark:border-slate-800 p-6 space-y-6 shrink-0 h-[calc(100vh-72px)] sticky top-[72px] overflow-y-auto hidden md:block bg-white dark:bg-[#0b0c1e] transition-colors duration-300`}>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3 mb-3 flex items-center gap-1.5">
              <Book size={12} className="text-primary-500" /> Manual Sections
            </p>
            <nav className="space-y-1">
              {sections.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all relative ${
                      isActive 
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20' 
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    {isActive && <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary-600 rounded-r" />}
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div className="no-print fixed inset-0 z-30 md:hidden flex">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="relative flex flex-col w-64 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 h-full p-6 justify-between z-10 pt-20">
              <div className="space-y-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Chapters</p>
                <nav className="space-y-1">
                  {sections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                        activeSection === sec.id 
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span>{sec.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>
          </div>
        )}

        {/* ── CORE PLAYBOOK WORKSPACE CANVAS ── */}
        <main className="flex-1 p-6 sm:p-10 md:p-16 max-w-4xl mx-auto print-container">
          
          <div className="space-y-16">

            {/* 1. Getting Started */}
            <section id="welcome" className="space-y-6 scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest block mb-2">Welcome</span>
                <h1 className="text-4xl md:text-5xl font-display font-black text-slate-950 dark:text-white tracking-tight">
                  RentalHub <span className="text-primary-600">User Manual</span>
                </h1>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 font-medium">Your complete guide to using the platform</p>
              </div>

              <div className="p-6 rounded-3xl bg-primary-500/10 border border-primary-500/20 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                <p className="font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider text-[10px] mb-1">About RentalHub</p>
                RentalHub connects tenants with landlords for seamless house rentals. Whether you're looking for your next home or managing rental properties, this guide will walk you through every step.
              </div>

              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4">
                <p>This manual is designed for everyday users - tenants searching for properties, landlords listing their spaces, and administrators managing the platform. No technical knowledge required.</p>
                <p>Use the navigation panel on the left to jump to the section that applies to you, or click <strong>Print / Save PDF</strong> to download this guide for offline reference.</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-4">
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Users size={16} className="text-primary-500" /> For Tenants
                  </h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Search properties, save favorites, send inquiries, and apply for rentals.
                  </p>
                </div>
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Home size={16} className="text-primary-500" /> For Landlords
                  </h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    List properties, manage bookings, track occupancy, and communicate with tenants.
                  </p>
                </div>
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary-500" /> For Admins
                  </h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Monitor platform activity, manage users, review audit logs, and ensure security.
                  </p>
                </div>
              </div>
            </section>


            {/* 2. For Tenants */}
            <section id="tenant" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                For Tenants
              </h2>
              
              <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-650 dark:text-slate-300">
                <p>As a tenant, you can browse available properties, save your favorites, contact landlords, and submit rental applications. Here's how to get started:</p>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">1</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Create Your Account</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Click "Register" in the top navigation. Enter your email, create a password, provide your full name, and select "Tenant" as your role. You'll receive a confirmation and can immediately start browsing.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">2</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Browse Properties</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Navigate to "Browse Properties" to see all available listings. Use filters to narrow down by location, maximum price, minimum bedrooms, and availability status. Switch between Grid view for photos or List view for more details.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">3</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">View Property Details</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Click on any property card to see full details including photo gallery, exact location, number of bedrooms, amenities (like parking, security, WiFi), and landlord contact information.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">4</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Save Favorites</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Click the heart icon on any property to add it to your favorites. Access your saved properties anytime from your Dashboard under the "Favorites" section.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">5</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Send an Inquiry</h4>
                      <p className="text-xs sm:text-sm text-slate-500">On a property detail page, type a message to the landlord (for example: "I'm interested in viewing this property next week") and click "Send Inquiry". The landlord will receive your message and can respond directly.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">6</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Apply for a Rental</h4>
                      <p className="text-xs sm:text-sm text-slate-500">When you're ready to apply, select your desired move-in and move-out dates on the property page, write a brief application message, and click "Request Tour / Apply". Your application will be sent to the landlord for review.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">7</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Track Your Applications</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Visit your Dashboard and click "Applications" to see all your rental requests. Status updates include: Pending (under review), Approved (landlord accepted), or Rejected (landlord declined). You'll be notified when status changes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>


            {/* 3. For Landlords */}
            <section id="landlord" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                For Landlords
              </h2>
              
              <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-650 dark:text-slate-300">
                <p>As a landlord, you can list your properties, manage rental applications, track occupancy, and communicate with potential tenants. Follow these steps to manage your rental portfolio:</p>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">1</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Register as a Landlord</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Click "Register" and select "Landlord" as your role. Complete your profile with your email, password, and full name. Once registered, you'll have access to the landlord dashboard.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">2</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Add Your First Property</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Go to your Dashboard and click "+ Add Listing". Fill in the property details: a catchy title, location, monthly rent in Tanzanian Shillings, number of bedrooms, and contact information. Write a detailed description to attract more tenants.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">3</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Upload Property Photos</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Drag and drop up to 10 high-quality images of your property. Each image can be up to 5MB in size. Supported formats include JPG, PNG, and WEBP. Good photos significantly increase interest in your listing.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">4</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Set Availability Status</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Choose the availability status: "Available" (visible to all tenants), "Rented" (marked as occupied), or "Hidden" (temporarily removed from search). You can change this status anytime from the Properties tab.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">5</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Publish Your Listing</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Click "Publish Property" to make your listing live on the marketplace. Tenants can now find, view, and apply for your property. You can edit or delete listings anytime from the Properties tab.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">6</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Review Rental Applications</h4>
                      <p className="text-xs sm:text-sm text-slate-500">When tenants apply for your property, you'll see their requests in the "Requests" tab of your Dashboard. Each application shows the tenant's email, requested dates, and their personal message.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">7</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Accept or Decline Applications</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Review each application and click "Accept Offer" to approve the rental. This automatically changes your property status to "Rented" and starts tracking revenue. Click "Decline" to keep the property available for other applicants.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">8</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Monitor Your Dashboard</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Your Dashboard shows key metrics: occupancy percentage (how many properties are rented), estimated monthly revenue from occupied units, and a session tracker. Use these insights to optimize your rental business.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>


            {/* 4. For Administrators */}
            <section id="admin" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                For Administrators
              </h2>
              
              <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-650 dark:text-slate-300">
                <p>Administrators oversee the entire platform, ensuring smooth operations, security, and user management. Here's what you need to know:</p>

                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-350 text-xs sm:text-sm space-y-2">
                  <p className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Important Security Note
                  </p>
                  <p>Administrators have elevated access to sensitive platform data. Always follow security best practices and regularly review audit logs to maintain platform integrity.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">1</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Access the Admin Dashboard</h4>
                      <p className="text-xs sm:text-sm text-slate-500">After logging in with admin credentials, you'll see the admin dashboard with overview statistics: total properties, total bookings, system logs, and active alerts. This gives you a snapshot of platform health.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">2</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Manage Users</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Navigate to the Users section to view all registered accounts. You can update user information, change roles, deactivate accounts, or remove users who violate platform policies.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">3</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Review Audit Logs</h4>
                      <p className="text-xs sm:text-sm text-slate-500">The Audit Logs section records all important system actions: user registrations, property changes, booking updates, and security events. Each log entry shows what happened, who did it, and when. Review these regularly to detect unusual activity.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">4</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Monitor Platform Statistics</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Check the Statistics section to understand platform usage: number of active listings, booking trends, user growth, and occupancy rates. Use this data to make informed decisions about platform improvements.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0 font-bold">5</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Handle Security Issues</h4>
                      <p className="text-xs sm:text-sm text-slate-500">If you notice suspicious activity in the audit logs or receive reports of misuse, take immediate action: deactivate problematic accounts, review affected bookings, and document the incident for future reference.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>


            {/* 5. Common Questions */}
            <section id="faq" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                Common Questions
              </h2>
              
              <div className="space-y-4 text-sm sm:text-base">
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">How do I reset my password?</h4>
                  <p className="text-xs sm:text-sm text-slate-500">Contact the platform administrator through the support contact information below. For security reasons, password resets are handled manually to protect user accounts.</p>
                </div>

                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Can I change my role from tenant to landlord?</h4>
                  <p className="text-xs sm:text-sm text-slate-500">Yes, contact the administrator to request a role change. You may need to provide additional information to verify your identity and eligibility for the landlord role.</p>
                </div>

                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">What happens when I accept a booking request?</h4>
                  <p className="text-xs sm:text-sm text-slate-500">When you accept a booking, the property automatically changes to "Rented" status. The tenant receives a notification, and the rental period begins on the specified start date. You can view all active rentals in your dashboard.</p>
                </div>

                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">How do I delete my account?</h4>
                  <p className="text-xs sm:text-sm text-slate-500">For account deletion, contact the administrator. They will guide you through the process and ensure any active bookings or listings are properly handled before closing your account.</p>
                </div>

                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Is my personal information secure?</h4>
                  <p className="text-xs sm:text-sm text-slate-500">Yes, the platform uses secure authentication and data protection measures. Your password is encrypted, and personal information is only accessible to authorized personnel. Audit logs track all data access for security monitoring.</p>
                </div>

                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">What image formats are supported for property photos?</h4>
                  <p className="text-xs sm:text-sm text-slate-500">You can upload JPG, PNG, and WEBP images. Each image must be under 5MB in size, and you can upload up to 10 images per property listing.</p>
                </div>
              </div>
            </section>


            {/* 6. Contact Support */}
            <section id="support" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                Contact Support
              </h2>
              
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-650 dark:text-slate-300">
                <p>If you need help with anything not covered in this manual, or if you encounter technical issues, please reach out to our support team:</p>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Mail size={16} className="text-primary-500" /> Email Support
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Send us an email at support@rentalhub.com. We typically respond within 24-48 hours.
                    </p>
                  </div>
                  <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Phone size={16} className="text-primary-500" /> Phone Support
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Call us at +255767113665 during business hours for urgent assistance.
                    </p>
                  </div>
                </div>

                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin size={16} className="text-primary-500" /> Office Location
                  </h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Visit our office in Dodoma, Tanzania (P.O.BOX 7000) for in-person support during business hours.
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 text-center no-print">
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-widest"
                >
                  <ArrowLeft size={14} /> Back to Homepage
                </button>
              </div>
            </section>

          </div>
        </main>
        
      </div>
    </div>
  );
};

export default Manual;
