import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { logout } from '../../store/authSlice'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useSelector(s => s.auth)
  const [menuOpen, setMenuOpen] = useState(false)

  const queryClient = useQueryClient()

  const handleLogout = () => {
    dispatch(logout())
    queryClient.clear()
    navigate('/')
  }

  const isActive = path => location.pathname === path

  const navLinks = isAuthenticated
    ? (user?.role === 'admin'
        ? ['Live Map', 'Admin Panel']
        : user?.role === 'DEPARTMENT_STAFF'
          ? ['Live Map', 'Department Panel']
          : ['Live Map', 'My Reports', 'Report Issue'])
    : ['Live Map', 'About', 'Features', 'How It Works', 'Contact']

  const resolveLink = link => {
    if (isAuthenticated) {
      const path = `/${link.toLowerCase().replace(/ /g, '-')}`
      return path === '/live-map'
        ? { type: 'route', to: '/map' }
        : path === '/admin-panel'
          ? { type: 'route', to: '/admin' }
          : path === '/department-panel'
            ? { type: 'route', to: '/department' }
            : path === '/my-reports'
              ? { type: 'route', to: '/dashboard' }
              : path === '/report-issue'
                ? { type: 'route', to: '/submit' }
                : { type: 'route', to: path }
    }

    if (link === 'Live Map') return { type: 'route', to: '/map' }
    if (link === 'About') return { type: 'anchor', to: '#about' }
    if (link === 'Features') return { type: 'anchor', to: '#features' }
    if (link === 'How It Works') return { type: 'anchor', to: '#how-it-works' }
    return { type: 'anchor', to: '#contact' }
  }

  const anchorHref = hash => (location.pathname === '/' ? hash : `/${hash}`)

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] h-20 w-full border-b border-white/20 bg-white/75 shadow-soft backdrop-blur-xl">
      <div className="flex h-full w-full items-center justify-between px-5 sm:px-5 lg:px-20">
        <Link to="/" className="flex items-center gap-3">
          <img src="/assets/elephant-final.png" alt="Logo" className="h-9 w-auto object-contain" />
          <span className="font-extrabold text-xl tracking-tighter text-primary">
            Mysore <span className="text-accent">Civic</span>
          </span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
          {navLinks.map(link => {
            const target = resolveLink(link)
            const active = target.type === 'route' ? isActive(target.to) : false

            if (target.type === 'anchor') {
              return (
                <a
                  key={link}
                  href={anchorHref(target.to)}
                  className="text-[0.95rem] font-semibold text-text-muted transition-colors duration-300 hover:text-primary"
                >
                  {link}
                </a>
              )
            }

            return (
              <Link
                key={link}
                to={target.to}
                className={`relative text-[0.95rem] font-semibold transition-colors duration-300 ${active ? 'text-primary' : 'text-text-muted hover:text-primary'}`}
              >
                {link}
                {active && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent"
                  />
                )}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {user?.role === 'admin' && (
                <Link to="/admin" className="hidden sm:inline-flex btn-ghost px-4 py-2 rounded-2xl text-sm font-bold border border-gray-100 hover:bg-gray-50 transition-all">
                  Admin
                </Link>
              )}
              <motion.div
                whileHover={{ y: -2 }}
                className="flex cursor-pointer items-center gap-3 rounded-full border border-gray-100 bg-white px-3 py-1.5 shadow-soft"
              >
                <span className="hidden text-xs font-bold text-primary sm:block">{user?.name}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-[0.7rem] font-black text-accent">
                  {user?.name?.[0]}
                </div>
              </motion.div>
              <button className="btn-primary px-5 py-2 text-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/login" className="btn-ghost px-5 py-2 text-sm">Login</Link>
              <Link to="/register" className="btn-accent px-5 py-2 text-sm">Register</Link>
            </div>
          )}

          <button
            className="flex flex-col gap-1.5 p-2 lg:hidden"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <div className={`h-0.5 w-6 bg-primary transition-all ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <div className={`h-0.5 w-6 bg-primary transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <div className={`h-0.5 w-6 bg-primary transition-all ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-0 right-0 top-20 z-50 flex flex-col gap-4 border-b border-gray-100 bg-white p-6 shadow-xl lg:hidden"
          >
            <Link to="/map" className="font-bold text-primary" onClick={() => setMenuOpen(false)}>Live Map</Link>
            {!isAuthenticated && <a href={anchorHref('#about')} className="font-bold text-primary" onClick={() => setMenuOpen(false)}>About</a>}
            {!isAuthenticated && <a href={anchorHref('#features')} className="font-bold text-primary" onClick={() => setMenuOpen(false)}>Features</a>}
            {!isAuthenticated && <a href={anchorHref('#how-it-works')} className="font-bold text-primary" onClick={() => setMenuOpen(false)}>How It Works</a>}
            {!isAuthenticated && <a href={anchorHref('#contact')} className="font-bold text-primary" onClick={() => setMenuOpen(false)}>Contact</a>}
            {isAuthenticated && user?.role === 'citizen' && <Link to="/submit" className="font-bold text-primary" onClick={() => setMenuOpen(false)}>Report Issue</Link>}
            {isAuthenticated && user?.role === 'citizen' && <Link to="/dashboard" className="font-bold text-primary" onClick={() => setMenuOpen(false)}>My Reports</Link>}
            {user?.role === 'admin' && <Link to="/admin" className="font-bold text-primary" onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
            {user?.role === 'DEPARTMENT_STAFF' && <Link to="/department" className="font-bold text-primary" onClick={() => setMenuOpen(false)}>Department Panel</Link>}
            <hr className="border-gray-50" />
            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                <button className="btn-primary w-full" onClick={() => { handleLogout(); setMenuOpen(false) }}>
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost text-center" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link to="/register" className="btn-accent text-center" onClick={() => setMenuOpen(false)}>Register</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
