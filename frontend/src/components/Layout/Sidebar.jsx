import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'

export default function Sidebar() {
  const location = useLocation()
  const { user } = useSelector(s => s.auth)

  const isAdmin = user?.role === 'admin'
  const currentUrl = `${location.pathname}${location.search}`

  const links = isAdmin ? [
    { name: 'Dashboard', icon: 'Dashboard', path: '/admin' },
    { name: 'Complaints', icon: 'Complaints', path: '/admin?tab=complaints' },
    { name: 'Live Map', icon: 'Map', path: '/map' },
    { name: 'Analytics', icon: 'Analytics', path: '/admin?tab=charts' },
    { name: 'Departments', icon: 'Departments', path: '/admin?tab=complaints' },
    { name: 'Settings', icon: 'Settings', path: '/admin?tab=settings' },
  ] : [
    { name: 'My Dashboard', icon: 'Dashboard', path: '/dashboard' },
    { name: 'Report Issue', icon: 'Report', path: '/submit' },
    { name: 'Live Map', icon: 'Map', path: '/map' },
    { name: 'Settings', icon: 'Settings', path: '/dashboard' },
  ]

  return (
    <aside className="w-72 sticky top-20 h-[calc(100vh-80px)] hidden lg:flex flex-col py-10 px-5 border-r border-gray-100">
      <div className="flex flex-col gap-1 flex-grow">
        {links.map(link => {
          const active = currentUrl === link.path || location.pathname === link.path

          return (
            <Link
              key={`${link.name}-${link.path}`}
              to={link.path}
              className={`flex items-center gap-4 px-6 py-3.5 rounded-2xl relative transition-all duration-300 group ${active ? 'text-primary' : 'text-text-muted hover:text-primary hover:bg-white hover:shadow-soft'}`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-accent/10 border border-accent/20 rounded-2xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="text-xs font-black uppercase tracking-[0.2em] z-10 min-w-[72px]">
                {link.icon}
              </span>
              <span className="font-bold text-[0.95rem] z-10">{link.name}</span>
            </Link>
          )
        })}
      </div>

      {isAdmin && (
        <div className="mt-auto pt-6 border-t border-gray-50">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-danger/10 border border-danger/20 p-4 rounded-2xl flex items-center justify-center gap-2 text-danger font-bold text-sm shadow-sm"
          >
            <span>Admin</span>
            <span>Mismatches need review</span>
          </motion.div>
        </div>
      )}
    </aside>
  )
}
