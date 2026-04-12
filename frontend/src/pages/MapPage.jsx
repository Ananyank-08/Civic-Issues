import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import MapView from '../components/Map/MapView'
import { motion, AnimatePresence } from 'framer-motion'

export default function MapPage() {
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [areaFilter, setAreaFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: points = [], isLoading: loadingPoints } = useQuery({
    queryKey: ['map-points'],
    queryFn: () => api.get('/map/points').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: heatPoints = [] } = useQuery({
    queryKey: ['heatmap-points'],
    queryFn: () => api.get('/map/heatmap').then(r => r.data),
    enabled: showHeatmap,
  })

  const uniqueAreas = Array.from(new Set(points.map(p => p.areaName).filter(Boolean))).sort()

  const mapPoints = points.filter(p => {
    if (areaFilter && p.areaName !== areaFilter) return false
    if (statusFilter && p.status !== statusFilter) return false
    return true
  })

  const areaFilteredPoints = areaFilter ? points.filter(p => p.areaName === areaFilter) : points
  const stats = {
    total: areaFilteredPoints.length,
    pending: areaFilteredPoints.filter(p => p.status === 'Pending').length,
    inProgress: areaFilteredPoints.filter(p => p.status === 'In Progress').length,
    resolved: areaFilteredPoints.filter(p => p.status === 'Resolved').length,
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Live Intelligence Map</h1>
          <p className="text-text-muted font-medium mt-1">Real-time civic operational health across Mysore wards</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            className="input-saas py-2.5 text-sm font-semibold min-w-[180px]"
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
          >
            <option value="">All City Regions</option>
            {uniqueAreas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${showHeatmap ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'btn-ghost border-gray-100'}`}
            onClick={() => setShowHeatmap(h => !h)}
          >
            🔥 {showHeatmap ? 'Heatmap Engaged' : 'Density Heatmap'}
          </button>
        </div>
      </motion.div>

      {/* Mini stats cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Logs',    statusValue: '',             value: stats.total,      color: 'primary', icon: '📊' },
          { label: 'Pending',       statusValue: 'Pending',      value: stats.pending,    color: 'warning', icon: '🟡' },
          { label: 'In Progress',   statusValue: 'In Progress',  value: stats.inProgress, color: 'accent',  icon: '🔵' },
          { label: 'Resolved',      statusValue: 'Resolved',     value: stats.resolved,   color: 'success', icon: '🟢' },
        ].map((s, i) => {
          const active = statusFilter === s.statusValue
          return (
            <motion.div 
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              onClick={() => setStatusFilter(s.statusValue)}
              className={`glass-card p-6 rounded-[28px] cursor-pointer relative group transition-all duration-300 ${active ? 'ring-2 ring-accent border-accent/20 bg-accent/5' : 'hover:border-accent/10'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-${s.color}/10 flex items-center justify-center text-xl`}>
                  {s.icon}
                </div>
                <div>
                   <div className={`text-2xl font-black text-primary leading-tight`}>{s.value}</div>
                   <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">{s.label}</div>
                </div>
              </div>
              {active && (
                <motion.div 
                  layoutId="map-stat-active" 
                  className="absolute bottom-3 right-5 w-1.5 h-1.5 bg-accent rounded-full"
                />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Map Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-[40px] shadow-premium h-[600px] overflow-hidden group/map relative"
      >
        <AnimatePresence>
          {loadingPoints && (
            <motion.div 
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[1001] bg-surface/90 flex flex-col items-center justify-center gap-4"
            >
              <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
              <p className="font-black text-sm text-text-muted uppercase tracking-[0.2em] animate-pulse">Calibrating Ward Intelligence...</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <MapView
          complaints={mapPoints}
          showHeatmap={showHeatmap}
          heatmapPoints={heatPoints}
        />
        
        {/* Map Overlays */}
        <div className="absolute bottom-10 left-10 z-[1000] flex gap-4 pointer-events-none">
           <div className="glass-card px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
             <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
             Real-time Sync Active
           </div>
           <div className="glass-card px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted">
             OSM Infrastructure Layer
           </div>
        </div>
      </motion.div>
    </div>
  )
}
