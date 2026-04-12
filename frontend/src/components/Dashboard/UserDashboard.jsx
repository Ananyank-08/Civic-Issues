import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import ComplaintCard from '../Complaint/ComplaintCard'
import { useState } from 'react'
import { motion } from 'framer-motion'

const STATUS_OPTS = ['', 'Pending', 'In Progress', 'Resolved']

export default function UserDashboard() {
  const { user } = useSelector(s => s.auth)
  const [filter, setFilter] = useState('')

  const { data: complaints = [], isLoading, refetch } = useQuery({
    queryKey: ['my-complaints'],
    queryFn: () => api.get('/complaints').then(r => r.data),
  })

  const filtered = filter ? complaints.filter(c => c.status === filter) : complaints

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    progress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
  }

  const handleDelete = () => refetch()

  return (
    <div className="flex flex-col gap-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{user?.name || 'Citizen'}</span>
          </h2>
          <p className="text-text-muted font-medium mt-1">
            Your personal dashboard for civic engagement in Mysore city.
          </p>
        </div>
        <Link
          to="/submit"
          className="btn-primary px-8 py-3.5 shadow-xl shadow-primary/20"
        >
          Report an Incident
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Submissions', value: stats.total, icon: 'Total', color: 'bg-primary/5 text-primary' },
          { label: 'Pending', value: stats.pending, icon: 'Pending', color: 'bg-warning/10 text-warning' },
          { label: 'Dispatch', value: stats.progress, icon: 'Active', color: 'bg-accent/10 text-accent' },
          { label: 'Resolved', value: stats.resolved, icon: 'Done', color: 'bg-success/10 text-success' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-[28px] flex flex-col items-center text-center gap-3 group hover:border-accent/10 transition-all duration-300"
          >
            <div className={`min-w-12 h-12 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase mb-1 ${s.color}`}>
              {s.icon}
            </div>
            <div className="text-2xl font-black text-primary leading-none">{s.value}</div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.1em]">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap p-1.5 bg-gray-100 rounded-2xl self-start gap-1">
          {STATUS_OPTS.map(st => (
            <button
              key={st || 'all'}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === st ? 'bg-white shadow-soft text-primary' : 'text-text-muted hover:text-primary'}`}
              onClick={() => setFilter(st)}
            >
              {st || 'All Reports'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[32px] gap-4">
            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
            <p className="font-black text-sm text-text-muted uppercase tracking-[0.2em] animate-pulse">Synchronizing Records...</p>
          </div>
        ) : complaints.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center p-20 glass-card rounded-[40px] gap-6 border border-dashed border-gray-200"
          >
            <div>
              <h3 className="text-xl font-black text-primary tracking-tight mb-2">No reports detected yet</h3>
              <p className="max-w-xs text-text-muted font-medium mb-8">Take initiative by reporting civic issues around Mysore.</p>
            </div>
            <Link to="/submit" className="btn-primary px-10 py-3.5 shadow-xl shadow-primary/20">Report an Issue</Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center p-20 glass-card rounded-[40px] gap-4"
          >
            <p className="font-black text-primary uppercase tracking-widest">No matching results for "{filter}"</p>
            <button onClick={() => setFilter('')} className="text-accent underline font-bold uppercase text-xs tracking-widest">Clear Filters</button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filtered.map(c => (
              <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} key={c.id}>
                <ComplaintCard
                  complaint={c}
                  onDelete={handleDelete}
                  onRefresh={refetch}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
