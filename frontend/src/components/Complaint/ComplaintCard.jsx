import { useState } from 'react'
import { useSelector } from 'react-redux'
import { formatDistanceToNow } from 'date-fns'
import api from '../../services/api'
import toast from 'react-hot-toast'
import StatusBadge, { PriorityBadge, CategoryBadge } from './StatusBadge'
import UpvoteButton from '../Community/UpvoteButton'
import CommentSection from '../Community/CommentSection'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORY_ICONS = {
  Pothole: '🕳️', 'Road Damage': '🛣️', Garbage: '🗑️', 'Open Drain': '🌊',
  'Water Leakage': '💧', 'Drainage Block': '🚫', 'Streetlight Issue': '💡',
  'Power Outage': '⚡', 'Park Damage': '🌳', 'Tree Fall': '🌲',
  'Traffic Signal': '🚦', Others: '📋', Invalid: '🚫',
}

export default function ComplaintCard({ complaint, onDelete, onRefresh, adminView = false }) {
  const { user, isAuthenticated } = useSelector(s => s.auth)
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const cat = complaint.finalCategory || complaint.nlpCategory
  const icon = CATEGORY_ICONS[cat] || '📋'
  const timeAgo = complaint.createdAt
    ? formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })
    : ''

  const handleDelete = async () => {
    if (!confirm('Delete this complaint?')) return
    setDeleting(true)
    try {
      await api.delete(`/complaints/${complaint.id}`)
      toast.success('Complaint deleted')
      onDelete?.(complaint.id)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div 
      layout
      className={`glass-card glass-card-hover relative flex flex-col overflow-hidden rounded-[32px] group ${complaint.mismatch ? 'border-danger/20' : ''}`}
    >
      {/* Decorative vertical bar based on status */}
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 z-10 transition-colors duration-500
        ${complaint.status === 'Resolved' ? 'bg-success' : complaint.status === 'In Progress' ? 'bg-accent' : 'bg-warning'}`} 
      />

      <div className="p-8 flex flex-col gap-6">
        {/* Top Header Section */}
        <div className="flex gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shadow-soft shrink-0 group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
          <div className="flex flex-col gap-3 grow">
             <div className="flex flex-wrap gap-2">
               <CategoryBadge category={complaint.finalCategory} />
               <PriorityBadge priority={complaint.nlpPriority} />
               {complaint.mismatch && (
                 <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-danger text-white">
                    ⚠️ Mismatch Found
                 </span>
               )}
             </div>
             <div className="flex items-center gap-4 text-[10px] font-black text-text-muted uppercase tracking-widest">
                <StatusBadge status={complaint.status} />
                {complaint.areaName && <span className="flex items-center gap-1 italic"><span className="text-xs">📍</span> {complaint.areaName}</span>}
                <span className="ml-auto lowercase font-bold">{timeAgo}</span>
             </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-4">
          <p className="text-gray-700 font-medium leading-relaxed px-1 text-sm lg:text-base">
            {expanded ? complaint.description : complaint.description?.slice(0, 140) + (complaint.description?.length > 140 ? '…' : '')}
          </p>

          {complaint.imageUrl && (
            <motion.div 
               layout
               className="relative rounded-[24px] overflow-hidden group/img cursor-pointer shadow-soft border border-gray-100"
               onClick={() => window.open(complaint.imageUrl, '_blank')}
            >
              <img
                src={complaint.imageUrl}
                alt="Evidence"
                className="w-full object-cover max-h-[300px] group-hover/img:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                 <span className="bg-white/90 backdrop-blur-sm text-primary px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl">Expand Image</span>
              </div>
            </motion.div>
          )}

          {adminView && complaint.department && (
            <div className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/5 px-3 py-1.5 rounded-lg border border-accent/10 self-start">
              🏢 {complaint.department} Infrastructure
            </div>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-6 pt-4 border-t border-gray-50"
              >
                {/* AI Chips */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex flex-col gap-1 p-3 bg-surface rounded-2xl border border-gray-100 min-w-[120px]">
                     <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none">Intelligence.NLP</span>
                     <span className="font-bold text-primary text-xs">{complaint.nlpCategory}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 bg-surface rounded-2xl border border-gray-100 min-w-[120px]">
                     <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none">Vision.OCR</span>
                     <span className="font-bold text-primary text-xs">{complaint.imageCategory || 'N/A'}</span>
                  </div>
                </div>

                {isAuthenticated && (
                  <CommentSection
                    complaintId={complaint.id}
                    comments={complaint.comments || []}
                    onRefresh={onRefresh}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center gap-3">
            {isAuthenticated && complaint.userId !== user?.userId && (
              <UpvoteButton
                complaintId={complaint.id}
                count={complaint.upvoteCount}
                hasUpvoted={complaint.hasUpvoted}
                onUpdate={onRefresh}
              />
            )}
            <button 
              className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-primary transition-colors px-2 py-1" 
              onClick={() => setExpanded(e => !e)}
            >
              {expanded ? '▲ Close Details' : '▼ Analytical Data'}
            </button>
          </div>
          
          {onDelete && complaint.status === 'Pending' && (
            <button 
              className="btn-ghost text-danger hover:bg-danger/5 text-[10px] font-black uppercase tracking-widest px-4 py-2" 
              onClick={handleDelete} 
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : '🗑️ Remove Log'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
