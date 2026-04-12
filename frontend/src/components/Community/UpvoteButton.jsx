import { useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function UpvoteButton({ complaintId, count = 0, hasUpvoted = false, onUpdate }) {
  const [optimisticCount, setOptimisticCount] = useState(count)
  const [optimisticHas, setOptimisticHas] = useState(hasUpvoted)
  const [loading, setLoading] = useState(false)

  const handleUpvote = async () => {
    if (loading) return
    // Optimistic update
    setOptimisticCount(c => optimisticHas ? c - 1 : c + 1)
    setOptimisticHas(h => !h)
    setLoading(true)
    try {
      await api.post(`/complaints/${complaintId}/upvote`)
      onUpdate?.()
    } catch {
      // Revert
      setOptimisticCount(c => optimisticHas ? c + 1 : c - 1)
      setOptimisticHas(h => !h)
      toast.error('Could not upvote')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      id={`upvote-${complaintId}`}
      className={`upvote-btn ${optimisticHas ? 'upvoted' : ''}`}
      onClick={handleUpvote}
      disabled={loading}
      title="Upvote this complaint"
    >
      <span className="upvote-icon">▲</span>
      <span className="upvote-count">{optimisticCount}</span>
    </button>
  )
}
