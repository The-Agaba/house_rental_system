import { Link } from 'react-router-dom';

const About = () => (
  <section className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
    <div className="container py-20">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 text-primary-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] dark:bg-primary-900/20 dark:text-primary-200">
          About RentalHub
        </span>
        <h1 className="mt-8 text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          Smarter rentals, built for people.
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
          RentalHub is a modern property marketplace that brings renters, landlords, and managers together in one secure, transparent experience. We blend trusted listings, verified partners, and seamless communication to make your next home easier to find and simpler to manage.
        </p>
      </div>

      <div className="mt-14 grid gap-6 xl:grid-cols-3">
        {[
          {
            title: 'Our Mission',
            description: 'Create a rental destination where people can discover verified homes, manage requests, and feel confident every step of the way.',
            accent: 'bg-primary-600/5 text-primary-700 dark:text-primary-300',
          },
          {
            title: 'What We Do',
            description: 'We combine curated property listings, secure landlord verification, and easy tenant communication into one intelligent hub.',
            accent: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
          },
          {
            title: 'Why It Works',
            description: 'By focusing on accuracy, speed, and quality, RentalHub helps users move confidently from search to move-in.',
            accent: 'bg-primary-600/5 text-primary-700 dark:text-primary-300',
          },
        ].map(item => (
          <div key={item.title} className="rounded-4xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl shadow-slate-900/5">
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.accent}`}>
              {item.title}
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        <div className="rounded-5xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-8 shadow-2xl shadow-slate-900/5">
          <h2 className="text-3xl font-bold text-slate-950 dark:text-white">A full rental experience for every user</h2>
          <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
            Whether you are searching for a new home, listing a property, or managing your rental portfolio, our platform is designed to keep things clear, fast, and secure.
          </p>
          <ul className="mt-8 space-y-4 text-slate-600 dark:text-slate-300">
            <li className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
              <span className="font-semibold">Verified listings</span> with transparent details and trusted landlord profiles.
            </li>
            <li className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
              <span className="font-semibold">Streamlined communication</span> so renters can book viewings and ask questions in one place.
            </li>
            <li className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
              <span className="font-semibold">Smart property discovery</span> with personalized recommendations and intuitive search filters.
            </li>
          </ul>
        </div>

        <div className="rounded-5xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/10">
          <div className="mb-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
            Built around trust
          </div>
          <h2 className="text-3xl font-bold">Our values</h2>
          <div className="mt-8 space-y-5 text-sm leading-7 text-slate-300">
            <div>
              <p className="font-semibold text-white">Transparency</p>
              <p>We keep every listing, fee, and landlord detail clear so users make informed decisions.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Security</p>
              <p>Reliable verification and secure communication are built into every connection.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Simplicity</p>
              <p>Complex rental workflows become easier with modern design and naturally organized tools.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 rounded-[2.75rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-10 sm:p-14 shadow-2xl shadow-slate-900/5">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-4xl bg-slate-100 dark:bg-slate-900 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Trusted</p>
            <h3 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">3,500+</h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">active rentals supported across our trusted marketplace.</p>
          </div>
          <div className="rounded-4xl bg-slate-100 dark:bg-slate-900 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Efficient</p>
            <h3 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">24/7</h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">support and property alerts keep users moving quickly.</p>
          </div>
          <div className="rounded-4xl bg-slate-100 dark:bg-slate-900 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Connected</p>
            <h3 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">1,200+</h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">verified landlords and property managers listed in our network.</p>
          </div>
        </div>
      </div>

      <div className="mt-14 text-center">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-primary-600 px-8 py-4 text-sm font-semibold text-white transition hover:bg-primary-500"
        >
          Back to Home
        </Link>
      </div>
    </div>
  </section>
);

export default About;
