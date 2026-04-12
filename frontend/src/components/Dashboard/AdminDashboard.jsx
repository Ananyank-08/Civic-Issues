import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import StatusBadge, { PriorityBadge, CategoryBadge } from '../Complaint/StatusBadge'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const STATUSES = ['Pending', 'In Progress', 'Resolved']
const PRIORITIES = ['', 'High', 'Medium', 'Low']
const DEPTS = [
  '', 'Road & Infrastructure', 'Sanitation', 'Water Supply & Drainage',
  'Electricity / Streetlights', 'Public Property & Parks', 'Traffic & Safety',
  'Pending Review', 'Others',
]

export default function AdminDashboard() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({ status: '', priority: '', department: '', mismatch: '', area: '' })

  const activeTab = (() => {
    const tab = searchParams.get('tab')
    if (tab === 'charts' || tab === 'settings') return tab
    return 'complaints'
  })()

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/stats').then(r => r.data),
  })

  const buildQuery = () => {
    const p = new URLSearchParams()
    if (filters.status) p.set('status', filters.status)
    if (filters.priority) p.set('priority', filters.priority)
    if (filters.department) p.set('department', filters.department)
    if (filters.mismatch) p.set('mismatch', 'true')
    if (filters.area) p.set('area', filters.area)
    return p.toString()
  }

  const { data: complaints = [], isLoading, refetch } = useQuery({
    queryKey: ['all-complaints', filters],
    queryFn: () => api.get(`/complaints/all?${buildQuery()}`).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/complaints/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated')
      refetch()
      qc.invalidateQueries(['admin-stats'])
    },
    onError: () => toast.error('Update failed'),
  })

  const updateArea = useMutation({
    mutationFn: ({ id, area }) => api.patch(`/complaints/${id}/area`, { area }),
    onSuccess: () => {
      toast.success('Area updated')
      refetch()
    },
    onError: () => toast.error('Update failed'),
  })

  const deptChartData = stats?.byDept
    ? Object.entries(stats.byDept).map(([name, count]) => ({ name: name.split(' ')[0], count }))
    : []

  const statusChartData = stats?.byStatus
    ? Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }))
    : []

  const switchTab = tab => {
    const nextParams = new URLSearchParams(searchParams)
    if (tab === 'complaints') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', tab)
    }
    setSearchParams(nextParams)
  }

  return (
    <div className="flex flex-col gap-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight">Admin Portal</h2>
          <p className="text-text-muted font-medium mt-1">Direct oversight of city-wide civic performance</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.a
            whileHover={{ scale: 1.02 }}
            href="/admin/mismatches"
            className="btn-ghost px-5 py-2.5 rounded-2xl text-danger border border-danger/20 bg-danger/5 hover:bg-danger/10 font-bold"
          >
            Review mismatches: {stats?.mismatches || 0}
          </motion.a>
        </div>
      </motion.div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total issues', value: stats.total, icon: 'Total', color: 'bg-primary/5 text-primary' },
            { label: 'Pending review', value: stats.byStatus?.Pending || 0, icon: 'Queue', color: 'bg-warning/10 text-warning' },
            { label: 'In progress', value: stats.byStatus?.['In Progress'] || 0, icon: 'Work', color: 'bg-accent/10 text-accent' },
            { label: 'Successfully resolved', value: stats.byStatus?.Resolved || 0, icon: 'Done', color: 'bg-success/10 text-success' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card glass-card-hover p-8 rounded-[28px] flex items-center gap-5"
            >
              <div className={`min-w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black uppercase ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <div className="text-3xl font-black text-primary leading-tight tracking-tight">{s.value}</div>
                <div className="text-xs font-bold text-text-muted uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap p-1.5 bg-gray-100 rounded-2xl self-start gap-1">
          <button
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'complaints' ? 'bg-white shadow-soft text-primary' : 'text-text-muted hover:text-primary'}`}
            onClick={() => switchTab('complaints')}
          >
            Incident List
          </button>
          <button
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'charts' ? 'bg-white shadow-soft text-primary' : 'text-text-muted hover:text-primary'}`}
            onClick={() => switchTab('charts')}
          >
            Performance Analytics
          </button>
          <button
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white shadow-soft text-primary' : 'text-text-muted hover:text-primary'}`}
            onClick={() => switchTab('settings')}
          >
            Admin Settings
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'charts' ? (
            <motion.div
              key="charts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="glass-card p-8 rounded-[32px]">
                <h4 className="font-black text-primary mb-8 ml-2">Departmental Load</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={deptChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card p-8 rounded-[32px]">
                <h4 className="font-black text-primary mb-8 ml-2">Resolution Distribution</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#f2c94c', '#5fa8d3', '#6fcf97'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ) : activeTab === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="glass-card p-8 rounded-[32px] lg:col-span-2 flex flex-col gap-6">
                <div>
                  <h4 className="font-black text-primary text-xl">Operational Controls</h4>
                  <p className="text-text-muted font-medium mt-2">
                    Complaint review, analytics monitoring, and mismatch handling are now routed through this admin workspace.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Pending review queue', value: stats?.byStatus?.Pending || 0 },
                    { label: 'High priority issues', value: stats?.highPriority || 0 },
                    { label: 'Open mismatches', value: stats?.mismatches || 0 },
                    { label: 'Tracked departments', value: Object.keys(stats?.byDept || {}).length },
                  ].map(card => (
                    <div key={card.label} className="rounded-3xl border border-gray-100 bg-surface p-6">
                      <div className="text-3xl font-black text-primary">{card.value}</div>
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mt-2">{card.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card p-8 rounded-[32px] flex flex-col gap-4">
                <h4 className="font-black text-primary text-xl">Quick Actions</h4>
                <button className="btn-ghost w-full justify-start px-5 py-3 text-left" onClick={() => switchTab('complaints')}>
                  Open complaint management
                </button>
                <button className="btn-ghost w-full justify-start px-5 py-3 text-left" onClick={() => switchTab('charts')}>
                  View analytics dashboards
                </button>
                <a href="/admin/mismatches" className="btn-ghost w-full px-5 py-3 text-left text-danger border border-danger/20 bg-danger/5 hover:bg-danger/10">
                  Review mismatch queue
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="complaints"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-6"
            >
              <div className="glass-card p-6 rounded-[28px] flex flex-wrap items-center gap-4">
                <select
                  className="input-saas py-2.5 text-sm font-semibold max-w-[180px]"
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  className="input-saas py-2.5 text-sm font-semibold max-w-[180px]"
                  value={filters.priority}
                  onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
                >
                  <option value="">All Priorities</option>
                  {PRIORITIES.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  className="input-saas py-2.5 text-sm font-semibold max-w-[220px]"
                  value={filters.department}
                  onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}
                >
                  {DEPTS.map(d => <option key={d} value={d}>{d || 'All Departments'}</option>)}
                </select>
                <input
                  type="text"
                  className="input-saas py-2.5 text-sm font-semibold max-w-[200px]"
                  placeholder="Search Area..."
                  value={filters.area}
                  onChange={e => setFilters(f => ({ ...f, area: e.target.value }))}
                />
                <label className="flex items-center gap-2 cursor-pointer grow justify-end">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-100 text-accent focus:ring-accent/30"
                    checked={filters.mismatch === 'true'}
                    onChange={e => setFilters(f => ({ ...f, mismatch: e.target.checked ? 'true' : '' }))}
                  />
                  <span className="text-xs font-black text-danger uppercase tracking-widest italic">Anomalies Only</span>
                </label>
                <button
                  className="btn-ghost px-5 py-2 text-xs font-black uppercase tracking-widest text-primary hover:bg-gray-100"
                  onClick={() => setFilters({ status: '', priority: '', department: '', mismatch: '', area: '' })}
                >
                  Reset
                </button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[32px] gap-4">
                  <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                  <p className="font-black text-sm text-text-muted uppercase tracking-[0.2em]">Synchronizing Data...</p>
                </div>
              ) : (
                <div className="glass-card rounded-[32px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-gray-100">Category</th>
                          <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-gray-100">Description</th>
                          <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-gray-100">Area</th>
                          <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-gray-100">Priority</th>
                          <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-gray-100">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-gray-100">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {complaints.map(c => (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={c.id}
                            className={`group hover:bg-accent/[0.02] transition-colors ${c.mismatch ? 'bg-danger/[0.02]' : ''}`}
                          >
                            <td className="px-8 py-5"><CategoryBadge category={c.finalCategory} /></td>
                            <td className="px-8 py-5">
                              <div className="font-semibold text-primary truncate max-w-[200px]" title={c.description}>
                                {c.description}
                              </div>
                              <div className="text-[10px] font-bold text-text-muted uppercase tracking-tighter mt-1">
                                {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : 'N/A'}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <input
                                type="text"
                                className="bg-transparent border-none p-0 font-bold text-sm text-primary focus:ring-0 w-full"
                                defaultValue={c.areaName}
                                onBlur={e => e.target.value !== c.areaName && updateArea.mutate({ id: c.id, area: e.target.value })}
                              />
                            </td>
                            <td className="px-8 py-5 text-[10px]"><PriorityBadge priority={c.nlpPriority} /></td>
                            <td className="px-8 py-5 scale-90 origin-left"><StatusBadge status={c.status} /></td>
                            <td className="px-8 py-5">
                              <select
                                className="bg-gray-50 border-none rounded-lg py-1.5 px-3 text-xs font-black text-primary ring-1 ring-gray-200 focus:ring-accent transition-all"
                                value={c.status}
                                onChange={e => updateStatus.mutate({ id: c.id, status: e.target.value })}
                              >
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {complaints.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                      <div className="text-5xl">No data</div>
                      <p className="font-bold text-text-muted tracking-tight">No matching incidents found for the current filters.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
