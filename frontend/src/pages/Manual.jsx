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
    { id: 'welcome', label: 'Welcome Guide' },
    { id: 'architecture', label: 'System Architecture' },
    { id: 'rbac', label: 'Access Controls (RBAC)' },
    { id: 'tenant', label: 'Elite Renter Playbook' },
    { id: 'landlord', label: 'Verified Host Playbook' },
    { id: 'admin', label: 'System Admin Playbook' },
    { id: 'database', label: 'Database Entity Model' },
    { id: 'api', label: 'REST API Endpoints' },
    { id: 'quickstart', label: 'Setup & Deployment' },
    { id: 'credentials', label: 'Admin Account' },
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
            <span className="font-display font-black tracking-tight text-slate-900 dark:text-white text-base block">RentalHub Playbook</span>
            <span className="text-[9px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest block -mt-1 font-display">System Manual & Book</span>
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
              <Book size={12} className="text-primary-500" /> Playbook Chapters
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

            {/* 1. Welcome Guide */}
            <section id="welcome" className="space-y-6 scroll-mt-24">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest block mb-2">The Playbook</span>
                <h1 className="text-4xl md:text-5xl font-display font-black text-slate-950 dark:text-white tracking-tight">
                  RentalHub <span className="text-primary-600">Playbook.</span>
                </h1>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 font-medium">The definitive system playbook & operational user manual.</p>
              </div>

              <div className="p-6 rounded-3xl bg-primary-500/10 border border-primary-500/20 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                <p className="font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider text-[10px] mb-1">System Overview Note</p>
                RentalHub is an elite house rental management system built for visual and operational excellence. Featuring interactive roles, live session metrics, direct coordination platforms, and secure auditing, it acts as a single cohesive unit for modern housing discovery.
              </div>

              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4">
                <p>This handbook compiles the core functional capabilities, administrative procedures, underlying data architectures, and APIs of the platform.</p>
                <p>Use the navigation panel on the left to jump between playbook chapters, or click <strong>Print / Save PDF</strong> at the top right to download a clean, professional user manual PDF for offline reference.</p>
              </div>
            </section>


            {/* 2. System Architecture */}
            <section id="architecture" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                1. System Architecture
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                RentalHub utilizes a decoupled, modern web structure. A fast Vite React application serves the interactive client interface, communicating via secure token-based JSON payloads with a Spring Boot API gateway backed by PostgreSQL.
              </p>
              
              <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">Technology Architecture</h4>
                <ul className="space-y-3.5 text-xs sm:text-sm">
                  <li><strong>Backend REST Gateway</strong>: Spring Boot 3.4 running on Java 17+, using Spring Security to secure all controller API operations.</li>
                  <li><strong>Frontend SPA Client</strong>: React 18, Vite build server, Framer Motion transitions, Lucide premium graphics, and Tailwind CSS.</li>
                  <li><strong>PostgreSQL Database</strong>: Enforces strict data models, references, constraints, and Flyway database version control.</li>
                  <li><strong>Unified Compilation</strong>: A custom Maven configuration enables compiling the React client directly into the Java executable JAR resources. A single `./mvnw clean install` creates the entire bundle.</li>
                </ul>
              </div>
            </section>


            {/* 3. Access Controls (RBAC) */}
            <section id="rbac" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                2. Role-Based Access Controls
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                User authorizations are partitioned into strict system roles. Below is the operational role access matrix:
              </p>

              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">Operations</th>
                      <th className="p-3 text-center">Elite Renter</th>
                      <th className="p-3 text-center">Verified Host</th>
                      <th className="p-3 text-center">Admin</th>
                      <th className="p-3 text-center">Guest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-600 dark:text-slate-350">
                    <tr>
                      <td className="p-3">Browse Marketplace</td>
                      <td className="p-3 text-center text-emerald-500">✔️</td>
                      <td className="p-3 text-center text-emerald-500">✔️</td>
                      <td className="p-3 text-center text-emerald-500">✔️</td>
                      <td className="p-3 text-center text-emerald-500">✔️</td>
                    </tr>
                    <tr>
                      <td className="p-3">Inquire & Booking Applications</td>
                      <td className="p-3 text-center text-emerald-500">✔️</td>
                      <td className="p-3 text-center text-rose-500">❌</td>
                      <td className="p-3 text-center text-rose-500">❌</td>
                      <td className="p-3 text-center text-rose-500">❌</td>
                    </tr>
                    <tr>
                      <td className="p-3">Publish Property Listings</td>
                      <td className="p-3 text-center text-rose-500">❌</td>
                      <td className="p-3 text-center text-emerald-500">✔️</td>
                      <td className="p-3 text-center text-emerald-500">✔️</td>
                      <td className="p-3 text-center text-rose-500">❌</td>
                    </tr>
                    <tr>
                      <td className="p-3">Accept/Decline Booking Offers</td>
                      <td className="p-3 text-center text-rose-500">❌</td>
                      <td className="p-3 text-center text-emerald-500">✔️</td>
                      <td className="p-3 text-center text-rose-500">❌</td>
                      <td className="p-3 text-center text-rose-500">❌</td>
                    </tr>
                    <tr>
                      <td className="p-3">Auditing & Security Logs</td>
                      <td className="p-3 text-center text-rose-500">❌</td>
                      <td className="p-3 text-center text-rose-500">❌</td>
                      <td className="p-3 text-center text-emerald-500">✔️</td>
                      <td className="p-3 text-center text-rose-500">❌</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>


            {/* 4. Elite Renter Playbook */}
            <section id="tenant" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                3. Elite Renter Playbook
              </h2>
              
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-650 dark:text-slate-300">
                <p>Elite Renters are the primary search market of the system. The platform provides streamlined discovery and communication channels for renters:</p>
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin size={16} className="text-primary-500" /> Advanced Discovery
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Browse thousands of verified units. Filter using specific geo-locations, price limits, minimum bedroom counts, and active availability. Toggle between Grid and List view.
                    </p>
                  </div>
                  <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock size={16} className="text-primary-500" /> Instant Coordination
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Select specific lease dates directly on the property detail page, write an onboarding message, and apply. Track status transitions (Pending, Approved, Rejected) live on your renter dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </section>


            {/* 5. Verified Host Playbook */}
            <section id="landlord" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                4. Verified Host Playbook
              </h2>
              
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-650 dark:text-slate-300">
                <p>Verified Hosts own and manage property configurations. The host panel focuses on real-time yields and easy inventory configurations:</p>
                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0">1</div>
                    <div>
                      <strong>Property Blueprint</strong>: Input listing title, location, room specifications, monthly rent, custom phone numbers, and contact emails. Include comprehensive descriptions and upload images up to 5MB.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0">2</div>
                    <div>
                      <strong>Offers Management</strong>: View incoming tenant requests. Checking tenant profiles, start/end dates, and application messages. Accept offers immediately to lock in tenancy.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-600 flex items-center justify-center shrink-0">3</div>
                    <div>
                      <strong>Occupancy Yields</strong>: Review metrics charts on your dashboard. Monitor portfolio occupancy with the progress gauge, estimate monthly cash flows, and manage settings.
                    </div>
                  </div>
                </div>
              </div>
            </section>


            {/* 6. System Admin Playbook */}
            <section id="admin" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                5. System Admin Playbook
              </h2>
              
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-650 dark:text-slate-300">
                <p>Administrators govern transactions, secure system stability, and audit core platform operations:</p>
                
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-350 text-xs sm:text-sm space-y-2">
                  <p className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Security Compliance & Audits
                  </p>
                  <p>Administrators must monitor the <strong>Security & Audit Logs</strong> feed daily. Database failures, authentication exceptions, and administrative actions are logged automatically by the system audit framework.</p>
                </div>

                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  <li><strong>Security Audits</strong>: Read transactional trace logs containing Action types, executing user emails, resource IDs, and timestamps.</li>
                  <li><strong>Database Moderation</strong>: Access lists of registered users, update permissions, toggle active statuses, or remove stale accounts.</li>
                  <li><strong>Statistics Overview</strong>: Access system stats measuring global marketplace inventories and query trends.</li>
                </ul>
              </div>
            </section>


            {/* 7. Database Entity Model */}
            <section id="database" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                6. Database Entity Model
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                RentalHub databases are controlled via Flyway migrations. Below is the relational entity model layout:
              </p>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                  <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Table Schema Definitions</h5>
                  <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                    <li><strong>users</strong>: `id` (BIGINT), `email` (VARCHAR), `password_hash` (VARCHAR), `role` (VARCHAR), `full_name` (VARCHAR), `active` (BOOLEAN).</li>
                    <li><strong>properties</strong>: `id` (BIGINT), `landlord_id` (BIGINT), `title` (VARCHAR), `description` (TEXT), `location` (VARCHAR), `price_per_month` (NUMERIC), `rooms` (INTEGER), `availability` (VARCHAR), `phone` (VARCHAR), `contact_email` (VARCHAR).</li>
                    <li><strong>bookings</strong>: `id` (BIGINT), `property_id` (BIGINT), `tenant_id` (BIGINT), `status` (VARCHAR), `start_date` (DATE), `end_date` (DATE), `message` (TEXT).</li>
                    <li><strong>messages</strong>: `id` (BIGINT), `sender_id` (BIGINT), `recipient_id` (BIGINT), `body` (TEXT).</li>
                    <li><strong>system_logs</strong>: `id` (BIGINT), `action` (VARCHAR), `entity_type` (VARCHAR), `entity_id` (BIGINT), `user_email` (VARCHAR), `details` (TEXT), `created_at` (TIMESTAMPTZ).</li>
                  </ul>
                </div>
              </div>
            </section>


            {/* 8. REST API Endpoints */}
            <section id="api" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                7. Technical REST API Reference
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                The gateway server exposes REST endpoints under the `/api/v1` path namespace. Authentication is handled using secure Bearer JWT tokens.
              </p>

              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 bg-slate-900 text-slate-250 rounded-2xl space-y-2">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-sans mb-2">🔐 Auth Panel (/api/v1/auth)</p>
                  <div>POST   /register          - Register new user</div>
                  <div>POST   /login             - Login & return JWT bearer</div>
                  <div>POST   /logout            - Terminate active session</div>
                  <div>GET    /me                - Fetch auth status</div>
                  <div>PUT    /profile           - Update personal profile details</div>
                </div>

                <div className="p-4 bg-slate-900 text-slate-250 rounded-2xl space-y-2">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-sans mb-2">🏢 Properties (/api/v1/properties)</p>
                  <div>GET    /                  - Search properties (Paged filter query)</div>
                  <div>GET    /my                - List host owned listings</div>
                  <div>GET    /{'{id}'}              - Fetch property metadata details</div>
                  <div>POST   /                  - Publish new property</div>
                  <div>PUT    /{'{id}'}              - Edit existing property</div>
                  <div>DELETE /{'{id}'}              - Remove property listing</div>
                  <div>POST   /{'{id}'}/images       - Upload multipart property files</div>
                </div>

                <div className="p-4 bg-slate-900 text-slate-250 rounded-2xl space-y-2">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-sans mb-2">📩 Applications (/api/v1/bookings)</p>
                  <div>GET    /                  - Fetch active applications history</div>
                  <div>GET    /my                - Get applications submitted by tenant</div>
                  <div>GET    /landlord          - Get applications received by host</div>
                  <div>POST   /                  - Apply for a property lease</div>
                  <div>PUT    /{'{id}'}              - Set booking offer status (Accept/Decline)</div>
                </div>

                <div className="p-4 bg-slate-900 text-slate-250 rounded-2xl space-y-2">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-sans mb-2">🛡️ Admin Console (/api/v1/admin)</p>
                  <div>GET    /users             - List all registered users</div>
                  <div>PATCH  /users/{'{id}'}        - Modify user attributes</div>
                  <div>DELETE /users/{'{id}'}        - Delete user from database</div>
                  <div>GET    /stats             - Calculate marketplace statistics</div>
                  <div>GET    /bookings          - View global transactions history</div>
                  <div>GET    /logs              - Retrieve system security audit log logs</div>
                </div>
              </div>
            </section>


            {/* 9. Setup & Deployment */}
            <section id="quickstart" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                8. Setup & Deployment Guide
              </h2>
              
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                  <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Local Environment Config (.env)</h5>
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed">
{`# Database Params
DB_URL=jdbc:postgresql://localhost:5432/house_rental
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Authentication Secret
JWT_SECRET=6e6082f88351504749d1537f7d10b9ee51018f33bb1e0a58c0ad768490784112
JWT_EXPIRATION_MS=86400000

# Cloudinary Integration
CLOUDINARY_CLOUD_NAME=dev-storage-bucket
CLOUDINARY_API_KEY=839482175928471
CLOUDINARY_API_SECRET=aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0u

# Frontend
VITE_API_URL=http://localhost:8080`}
                  </pre>
                </div>

                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                  <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Production Monolithic Build Command</h5>
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed">
{`# Build unified React and Spring Boot package
./mvnw clean install

# Execute unified monolithic runner JAR
java -jar target/house_rental-0.0.1-SNAPSHOT.jar`}
                  </pre>
                </div>
              </div>
            </section>


          {/* 10. Admin Account */}
            <section id="credentials" className="space-y-6 scroll-mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-16">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block" />
                9. Admin Account
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                The app starts fresh with only the administrator predefined. Create landlord and tenant accounts from the registration page.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">Functional Role</th>
                      <th className="p-3">Username / Email</th>
                      <th className="p-3">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-600 dark:text-slate-350">
                    <tr>
                      <td className="p-3">System Admin</td>
                      <td className="p-3 font-mono">admin@gmail.com</td>
                      <td className="p-3 font-mono">admin</td>
                    </tr>
                  </tbody>
                </table>
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
