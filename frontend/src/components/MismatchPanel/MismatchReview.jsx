import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../../services/api'
import { CategoryBadge, PriorityBadge } from '../Complaint/StatusBadge'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import './MismatchPanel.css'

const ALL_CATEGORIES = [
  'Potholes','Garbage','Water Leakage','Streetlight Issue',
  'Treefall','Traffic Light','Others (Valid Civic Issues)',
  'Invalid (Noise/Spam)'
]

export default function MismatchReview() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState({})

  const { data: complaints = [], isLoading, refetch } = useQuery({
    queryKey: ['mismatches'],
    queryFn: () => api.get('/complaints/all?mismatch=true').then(r => r.data),
  })

  const resolveCategory = useMutation({
    mutationFn: ({ id, category }) => api.patch(`/complaints/${id}/category`, { category }),
    onSuccess: (_,vars) => {
      toast.success(`Resolved as: ${vars.category}`)
      refetch()
      qc.invalidateQueries(['admin-stats'])
    },
    onError: () => toast.error('Failed to resolve'),
  })

  const handleResolve = (id) => {
    const cat = selected[id]
    if (!cat) { toast.error('Select a category first'); return }
    resolveCategory.mutate({ id, category: cat })
  }

  if (isLoading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="mismatch-panel animate-fade-in">
      <div className="mismatch-header">
        <div>
          <h2 className="dash-title">⚠️ Mismatch <span className="gradient-text">Review Queue</span></h2>
          <p style={{ color:'var(--text-muted)', marginTop:'0.3rem' }}>
            {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} where AI text and image disagree
          </p>
        </div>
      </div>

      {complaints.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="empty-icon">🎉</span>
          <h3>All clear!</h3>
          <p>No mismatch complaints awaiting review.</p>
        </div>
      ) : (
        <div className="mismatch-list">
          {complaints.map(c => (
            <div key={c.id} className="mismatch-card glass-card animate-slide-up">
              {/* Top row */}
              <div className="mc-header">
                <div>
                  <PriorityBadge priority={c.nlpPriority} />
                  {c.areaName && <span style={{ marginLeft:'0.5rem', fontSize:'0.82rem', color:'var(--text-muted)' }}>📍 {c.areaName}</span>}
                </div>
                <span style={{ fontSize:'0.8rem', color:'var(--text-dim)' }}>
                  {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
                </span>
              </div>

              {/* Description */}
              <p className="mc-description">{c.description}</p>

              {/* Image */}
              {c.imageUrl && <img src={c.imageUrl} alt="complaint" className="mc-image" />}

              {/* Side-by-side AI comparison */}
              <div className="mc-compare">
                <div className="mc-model-box mc-nlp">
                  <div className="mc-model-label">🧠 NLP Text Result</div>
                  <div className="mc-model-cat">{c.nlpCategory}</div>
                  <div className="mc-model-line">Priority: <strong>{c.nlpPriority}</strong></div>
                </div>
                <div className="mc-vs">VS</div>
                <div className="mc-model-box mc-img">
                  <div className="mc-model-label">🖼️ Image CNN Result</div>
                  <div className="mc-model-cat">{c.imageCategory || 'Unknown'}</div>
                  <div className="mc-model-line">
                    {c.imageCategory && c.imageCategory !== 'Unknown'
                      ? 'Detected from photo'
                      : 'Could not determine'}
                  </div>
                </div>
              </div>

              {/* Admin resolution */}
              <div className="mc-resolve">
                <label className="form-label">Confirm Correct Category</label>
                <div className="mc-resolve-row">
                  <select
                    className="form-select"
                    value={selected[c.id] || ''}
                    onChange={e => setSelected(s => ({ ...s, [c.id]: e.target.value }))}
                  >
                    <option value="">— Select category —</option>
                    {ALL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleResolve(c.id)}
                    disabled={!selected[c.id] || resolveCategory.isPending}
                  >
                    ✓ Resolve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      setSelected(s => ({ ...s, [c.id]: 'Invalid' }))
                      resolveCategory.mutate({ id: c.id, category: 'Invalid' })
                    }}
                  >
                    🚫 Mark Invalid
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
