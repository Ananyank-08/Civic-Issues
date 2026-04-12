import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout({ children, title, subtitle, footer }) {
  const benefits = [
    'Preserve the Royal Heritage of Mysore',
    'AI-powered accuracy for every report',
    'Real-time tracking of civic resolutions',
    'Contribute to a cleaner, safer city'
  ]

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Container wrapper */}
      <div className="flex w-full">
        {/* Left Side: Deep Navy Info Panel (Hidden on mobile) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center p-20 overflow-hidden"
        >
          {/* Subtle Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative z-10 max-w-lg">
            <h1 className="text-5xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">The Path to a Majestic Mysore.</h1>
            <p className="text-xl text-white/70 mb-12 leading-relaxed">
              Join thousands of citizens in upholding the elegance and heritage of Mysore. 
              Modern technology for a timeless city.
            </p>
            
            <div className="flex flex-col gap-6 mb-12">
              {benefits.map((b, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  key={i} 
                  className="flex items-center gap-4 group"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center text-accent font-black transition-transform group-hover:scale-110">
                    <span className="text-xs">✓</span>
                  </div>
                  <span className="text-white/80 font-semibold">{b}</span>
                </motion.div>
              ))}
            </div>

            <div className="text-white/40 font-black text-xs uppercase tracking-[0.2em]">
              Official Mysore Civic Portal — v2.0
            </div>
          </div>
        </motion.div>

        {/* Right Side: Action Form */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-20 bg-surface"
        >
          <div className="w-full max-w-[440px]">
            <div className="mb-10">
              <Link to="/" className="inline-block lg:hidden mb-8 text-2xl font-black text-primary">
                Mysore <span className="text-accent">Civic</span>
              </Link>
              <h2 className="text-3xl font-black text-primary mb-2 tracking-tight">{title}</h2>
              <p className="text-text-muted font-medium">
                {subtitle.text}{' '}
                <Link to={subtitle.link} className="text-accent font-bold hover:underline">
                  {subtitle.linkText}
                </Link>
              </p>
            </div>

            <div className="bg-white/50 backdrop-blur-xl border border-white p-2 rounded-[24px]">
               <div className="bg-white p-8 rounded-[20px] shadow-soft">
                  {children}
               </div>
            </div>

            <div className="relative my-10 flex items-center">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="px-5 text-xs text-text-muted font-black uppercase tracking-widest bg-surface">Or use one-tap</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <button className="w-full btn-ghost p-4 flex items-center justify-center gap-3 shadow-soft group">
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="w-5 h-5 group-hover:scale-110 transition-transform"
              />
              <span className="font-bold">Sign in with Google</span>
            </button>

            {footer && <div className="mt-10 pt-8 border-t border-gray-50 text-center">{footer}</div>}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
