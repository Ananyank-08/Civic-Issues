import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'

const categories = [
  'Pothole',
  'Road Damage',
  'Garbage',
  'Open Drain',
  'Water Leakage',
]

const features = [
  {
    icon: 'Heritage',
    title: 'Heritage Focused',
    description: 'Dedicated civic tools built to preserve the royal visual identity and cleanliness standards of Mysore.',
  },
  {
    icon: 'Map',
    title: 'City-Wide Map',
    description: 'A real-time ward view helps citizens and officials spot issue density, movement, and civic health patterns.',
  },
  {
    icon: 'AI',
    title: 'Precision AI',
    description: 'Advanced complaint classification improves routing quality and reduces delays between reporting and action.',
  },
]

const stats = [
  { value: '500+', label: 'Issues Resolved' },
  { value: '48 hrs', label: 'Avg. Resolution' },
  { value: '98%', label: 'Citizen Satisfaction' },
]

function CategoryPill({ label }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.05 }}
      className="rounded-full bg-white px-6 py-3.5 text-[16px] font-semibold text-primary shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:bg-accent hover:text-white"
    >
      {label}
    </motion.div>
  )
}

function FeatureCard({ icon, title, description, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay }}
      whileHover={{ y: -6 }}
      className="rounded-[20px] border border-white/70 bg-white/70 p-7 shadow-[0_8px_25px_rgba(0,0,0,0.05)] backdrop-blur-[10px] transition-all duration-300"
    >
      <div className="inline-flex rounded-2xl bg-[#edf4ff] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
        {icon}
      </div>
      <h3 className="mt-6 text-[24px] font-bold text-primary">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-text-muted">{description}</p>
      <div className="mt-6 text-sm font-semibold text-accent">Learn more</div>
    </motion.div>
  )
}

export default function LandingPage() {
  const { isAuthenticated } = useSelector(s => s.auth)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-full m-0 min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#f4f7fb,#eaf1f8)]"
    >
      <section className="w-screen max-w-full pb-16 pt-24 lg:pt-28">
        <div className="w-full max-w-full m-0 px-5 sm:px-5 lg:px-10">
          <div className="relative w-full overflow-hidden">
            <div className="flex flex-col gap-8 lg:min-h-[640px] lg:flex-row lg:items-center lg:gap-3">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-20 flex w-full items-center pt-6 lg:w-[55%] lg:py-8"
              >
                <div className="w-full max-w-[900px] lg:pl-24 xl:pl-32">
                  <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.75, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center rounded-full bg-[#e7f1ff] px-6 py-3 text-[15px] font-semibold text-accent shadow-[0_4px_12px_rgba(95,168,211,0.12)]"
                  >
                    Building a Better Mysore
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-6 max-w-[900px] text-[48px] font-bold leading-[1.01] tracking-[-0.045em] text-primary md:text-[72px] xl:text-[84px]"
                  >
                    <span className="block">The Path to a</span>
                    <motion.span
                      initial={{ opacity: 0, y: 28, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.95, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="block text-[56px] text-accent md:text-[78px] xl:text-[90px]"
                    >
                      Majestic Mysore
                    </motion.span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 26, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-5 max-w-[720px] text-[21px] leading-9 text-text-muted"
                  >
                    Our platform empowers every citizen to uphold the high standards Mysore is known for globally.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-8 flex max-w-[760px] flex-wrap gap-3"
                  >
                    {categories.map(category => (
                      <CategoryPill key={category} label={category} />
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-9 flex flex-col gap-4 sm:flex-row"
                  >
                    <Link
                      to={isAuthenticated ? '/submit' : '/register'}
                      className="inline-flex items-center justify-center rounded-full bg-primary px-9 py-4.5 text-[17px] font-semibold text-white shadow-[0_8px_20px_rgba(30,42,56,0.16)] transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_20px_rgba(30,42,56,0.3)]"
                    >
                      Report an Issue
                    </Link>
                    <Link
                      to="/map"
                      className="inline-flex items-center justify-center rounded-full border border-[#d0d7e2] bg-transparent px-9 py-4.5 text-[17px] font-semibold text-primary transition-all duration-300 hover:bg-white/70"
                    >
                      Live Map
                    </Link>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 1.05, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full lg:w-[45%] lg:self-stretch"
              >
                <div className="relative min-h-[320px] overflow-hidden md:min-h-[420px] lg:min-h-[620px]">
                  <motion.img
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    src="/assets/mysore-palace-landing.png"
                    alt="Mysore Palace"
                    className="absolute inset-y-0 left-[-80px] h-full w-[120%] max-w-none object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(244,247,251,0.95)_0%,rgba(244,247,251,0.82)_38%,rgba(244,247,251,0.48)_68%,rgba(244,247,251,0.12)_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_28%,rgba(255,255,255,0.18),transparent_22%)]" />

                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-5 right-8 z-20 flex rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_34px_rgba(51,74,118,0.14)] backdrop-blur-[12px] md:bottom-6 md:right-10 lg:right-20"
                  >
                    {stats.map(item => (
                      <div key={item.label} className="min-w-[86px] px-3 text-center">
                        <div className="text-[22px] font-bold text-primary">{item.value}</div>
                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-full m-0 px-5 pb-14 sm:px-5 lg:px-20">
        <div className="w-full rounded-[36px] bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.86)_18%,#ffffff_100%)] px-5 pb-10 pt-16 sm:px-6 lg:px-10">
          <div className="mx-auto flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#dde6f3] bg-white text-sm font-semibold text-accent shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            O
          </div>

          <motion.div
            id="about"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-[700px] text-center"
          >
            <div className="inline-flex rounded-full bg-[#eef5ff] px-5 py-2.5 text-[14px] font-semibold text-accent">
              Powered by Technology, Driven by People
            </div>
            <h2 className="mt-4 text-[48px] font-bold text-primary md:text-[54px]">Heritage Features</h2>
            <p className="mt-3 text-[17px] leading-8 text-text-muted">
              Advanced digital tools designed to maintain city-wide excellence with cleaner operations and faster reporting.
            </p>
          </motion.div>

          <div id="features" className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.08}
              />
            ))}
          </div>

          <div className="mt-8 rounded-[20px] bg-[linear-gradient(90deg,#1e2a38,#243b72)] px-5 py-5 text-white shadow-[0_12px_28px_rgba(30,42,56,0.18)]">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ['AI-Powered Accuracy', 'Smart issue classification'],
                ['Real-time Tracking', 'Live updates and notifications'],
                ['Direct to Authorities', 'Fast department routing'],
                ['Cleaner Mysore', 'Together, we make it happen'],
              ].map(item => (
                <div key={item[0]}>
                  <div className="text-sm font-semibold">{item[0]}</div>
                  <div className="mt-1 text-xs text-white/70">{item[1]}</div>
                </div>
              ))}
            </div>
          </div>

          <div id="how-it-works" className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[22px] bg-[linear-gradient(180deg,#233252,#1e2a38)] p-7 text-white shadow-[0_18px_36px_rgba(30,42,56,0.18)]">
              <div className="flex items-center gap-3">
                <img src="/assets/elephant-final.png" alt="Mysore Civic" className="h-8 w-8 rounded-lg object-cover" />
                <div>
                  <div className="text-sm font-semibold">Mysore Civic</div>
                  <div className="text-xs text-white/60">Proudly built for Mysore</div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-white/78">
                Preserve the city&apos;s heritage character through a reporting experience that is elegant, transparent, and easy to act on.
              </p>

              <div className="mt-7 space-y-3">
                {[
                  'Protect the Royal Heritage of Mysore',
                  'AI-powered accuracy for every report',
                  'Real-time tracking of civic resolutions',
                  'Direct digital link to city authorities',
                ].map(step => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f7c96f] text-[10px] font-semibold text-primary">
                      ✓
                    </div>
                    <div className="text-sm text-white/88">{step}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-[#e3ebf6] bg-white p-7 shadow-[0_10px_32px_rgba(0,0,0,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[28px] font-bold text-primary">Welcome Back</h3>
                  <p className="mt-2 text-sm text-text-muted">Sign in to continue.</p>
                </div>
                <div className="rounded-full bg-[#eef5ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
                  Citizen Access
                </div>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Email Address</div>
                    <div className="rounded-xl border border-[#e1e8f0] px-4 py-3 text-sm text-text-muted">Enter your email</div>
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Password</div>
                    <div className="rounded-xl border border-[#e1e8f0] px-4 py-3 text-sm text-text-muted">Enter your password</div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link to="/login" className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]">
                      Sign In
                    </Link>
                    <Link to="/register" className="inline-flex flex-1 items-center justify-center rounded-full border border-[#d0d7e2] px-6 py-3 text-sm font-semibold text-primary transition-all duration-300 hover:bg-[#f7fbff]">
                      Register
                    </Link>
                  </div>
                </div>

                <div className="rounded-[18px] bg-[#f7fbff] p-5">
                  <div className="text-sm font-semibold text-primary">How it works</div>
                  <div className="mt-4 space-y-4">
                    {[
                      ['01', 'Report'],
                      ['02', 'Classify'],
                      ['03', 'Route'],
                      ['04', 'Resolve'],
                    ].map(step => (
                      <div key={step[0]} className="flex gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-xs font-semibold text-accent shadow-[0_4px_10px_rgba(0,0,0,0.04)]">
                          {step[0]}
                        </div>
                        <div className="pt-2 text-sm font-medium text-primary">{step[1]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="w-full max-w-full m-0 px-5 pb-12 sm:px-5 lg:px-20">
        <div className="w-full rounded-[22px] border border-white/60 bg-white/65 px-6 py-7 shadow-[0_10px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-2xl font-bold text-primary">Mysore Civic</div>
              <p className="mt-2 max-w-[640px] text-sm leading-7 text-text-muted">
                A civic experience designed to preserve Mysore&apos;s elegance while making issue reporting, tracking, and resolution feel modern and effortless.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/map" className="inline-flex items-center justify-center rounded-full border border-[#d0d7e2] px-5 py-3 text-sm font-semibold text-primary">
                Explore Live Map
              </Link>
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
              >
                {isAuthenticated ? 'Open Dashboard' : 'Login'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  )
}
