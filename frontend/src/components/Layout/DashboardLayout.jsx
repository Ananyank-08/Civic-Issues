import Sidebar from './Sidebar'
import { motion } from 'framer-motion'

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-surface pt-20">
      <Sidebar />
      <motion.main 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-grow p-8 lg:p-12 overflow-y-auto"
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </motion.main>
    </div>
  )
}
