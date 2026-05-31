import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Home, 
  Target, 
  Briefcase, 
  TrendingUp, 
  Shield, 
  MessageSquare, 
  Search, 
  Eye, 
  Lock, 
  Smartphone,
  CheckCircle,
  Award,
  Clock,
  Users,
  Building,
  Heart
} from 'lucide-react';

const About = () => {
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const isInView1 = useInView(ref1, { once: true, amount: 0.2 });
  const isInView2 = useInView(ref2, { once: true, amount: 0.2 });
  const isInView3 = useInView(ref3, { once: true, amount: 0.2 });

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-[120px]" />
      </div>

      <div className="container relative py-20 px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center gap-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] mb-6"
          >
            <Heart size={14} className="text-primary-600 dark:text-primary-400" />
            Welcome to RentalHub
          </motion.div>
          
          <motion.h1 
            variants={fadeUp}
            className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-primary-600 to-slate-900 dark:from-white dark:via-primary-400 dark:to-white bg-clip-text text-transparent"
          >
            Smarter rentals, built for people.
          </motion.h1>
          
          <motion.p 
            variants={fadeUp}
            className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
          >
            RentalHub is a modern property marketplace that brings renters, landlords, 
            and managers together in one secure, transparent experience. We blend trusted 
            listings, verified partners, and seamless communication to make your next home 
            easier to find and simpler to manage.
          </motion.p>
        </motion.div>

        {/* Mission/What/Why Cards */}
        <motion.div 
          ref={ref1}
          variants={staggerContainer}
          initial="hidden"
          animate={isInView1 ? "visible" : "hidden"}
          className="mt-20 grid gap-6 md:grid-cols-3"
        >
          {[
            {
              icon: Target,
              title: 'Our Mission',
              description: 'Create a rental destination where people can discover verified homes, manage requests, and feel confident every step of the way.',
              gradient: 'from-primary-500 to-blue-500',
              bg: 'bg-primary-50 dark:bg-primary-950/20',
              color: 'text-primary-600 dark:text-primary-400'
            },
            {
              icon: Briefcase,
              title: 'What We Do',
              description: 'We combine curated property listings, secure landlord verification, and easy tenant communication into one intelligent hub.',
              gradient: 'from-slate-600 to-slate-800',
              bg: 'bg-slate-100 dark:bg-slate-800',
              color: 'text-slate-700 dark:text-slate-300'
            },
            {
              icon: TrendingUp,
              title: 'Why It Works',
              description: 'By focusing on accuracy, speed, and quality, RentalHub helps users move confidently from search to move-in.',
              gradient: 'from-primary-500 to-blue-500',
              bg: 'bg-primary-50 dark:bg-primary-950/20',
              color: 'text-primary-600 dark:text-primary-400'
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              variants={staggerItem}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-8 shadow-xl transition-all duration-300 hover:shadow-2xl"
            >
              <div className={`inline-flex rounded-xl ${item.bg} p-3 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
              <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300 pointer-events-none`} />
            </motion.div>
          ))}
        </motion.div>

        {/* Rental Experience Section */}
        <motion.div 
          ref={ref2}
          variants={staggerContainer}
          initial="hidden"
          animate={isInView2 ? "visible" : "hidden"}
          className="mt-20 grid gap-8 lg:grid-cols-2"
        >
          <motion.div 
            variants={staggerItem}
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-8 shadow-xl transition-all duration-300"
          >
            <div className="inline-flex rounded-xl bg-primary-100 dark:bg-primary-900/30 p-3 mb-6">
              <Building className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-950 dark:text-white mb-4">A full rental experience for every user</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300 mb-8">
              Whether you are searching for a new home, listing a property, or managing your rental portfolio, 
              our platform is designed to keep things clear, fast, and secure.
            </p>
            <div className="space-y-4">
              {[
                { icon: CheckCircle, text: 'Verified listings with transparent details and trusted landlord profiles.' },
                { icon: MessageSquare, text: 'Streamlined communication so renters can book viewings and ask questions in one place.' },
                { icon: Search, text: 'Smart property discovery with personalized recommendations and intuitive search filters.' },
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  variants={staggerItem}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <feature.icon className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{feature.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            variants={staggerItem}
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-xl transition-all duration-300"
          >
            <div className="inline-flex rounded-xl bg-white/10 p-3 mb-6">
              <Shield className="w-6 h-6 text-primary-400" />
            </div>
            <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200 mb-6">
              Built around trust
            </div>
            <h2 className="text-3xl font-bold mb-8">Our core values</h2>
            <div className="space-y-6">
              {[
                { icon: Eye, title: 'Transparency', desc: 'We keep every listing, fee, and landlord detail clear so users make informed decisions.' },
                { icon: Lock, title: 'Security', desc: 'Reliable verification and secure communication are built into every connection.' },
                { icon: Smartphone, title: 'Simplicity', desc: 'Complex rental workflows become easier with modern design and naturally organized tools.' },
              ].map((value, idx) => (
                <motion.div 
                  key={idx}
                  variants={staggerItem}
                  className="group flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 group-hover:bg-primary-500/20 transition-all flex items-center justify-center">
                    <value.icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">{value.title}</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{value.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          ref={ref3}
          variants={staggerContainer}
          initial="hidden"
          animate={isInView3 ? "visible" : "hidden"}
          className="mt-20"
        >
          <motion.div 
            variants={staggerItem}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-10 sm:p-14 shadow-xl"
          >
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { icon: Users, stat: '3,500+', label: 'active rentals supported', description: 'across our trusted marketplace.' },
                { icon: Clock, stat: '24/7', label: 'support & alerts', description: 'keep users moving quickly.' },
                { icon: Award, stat: '1,200+', label: 'verified landlords', description: 'property managers listed in our network.' },
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  variants={staggerItem}
                  whileHover={{ y: -5 }}
                  className="group text-center p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 hover:shadow-lg transition-all duration-300"
                >
                  <div className="inline-flex rounded-full bg-primary-100 dark:bg-primary-900/30 p-3 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-primary-600 dark:from-white dark:to-primary-400 bg-clip-text text-transparent mb-2">
                    {item.stat}
                  </h3>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{item.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <Link
            to="/"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 transition-all duration-300 hover:scale-105"
          >
            <Home size={18} />
            Back to Home
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>

      </div>
    </section>
  );
};

export default About;