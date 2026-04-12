import { useState } from 'react'
import api from '../../services/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import './Community.css'

export default function CommentSection({ complaintId, comments = [], onRefresh }) {
  const { user } = useSelector(s => s.auth)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [localComments, setLocalComments] = useState(comments)

  const handlePost = async e => {
    e.preventDefault()
    if (!text.trim()) return
    setPosting(true)
    try {
      await api.post(`/complaints/${complaintId}/comment`, { text })
      const newComment = { userId: user?.userId, text, createdAt: new Date().toISOString() }
      setLocalComments(c => [...c, newComment])
      setText('')
      onRefresh?.()
    } catch {
      toast.error('Could not post comment')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="comment-section">
      <div className="comment-header">💬 Comments ({localComments.length})</div>

      {localComments.length === 0 && (
        <p className="no-comments">No comments yet. Be the first to comment.</p>
      )}

      <div className="comments-list">
        {localComments.map((c, i) => (
          <div key={i} className="comment-item">
            <div className="comment-avatar">
              {(c.userId?.toString()?.slice(-2) || '?')}
            </div>
            <div className="comment-body">
              <p className="comment-text">{c.text}</p>
              <span className="comment-time">
                {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      <form className="comment-form" onSubmit={handlePost}>
        <input
          id={`comment-input-${complaintId}`}
          type="text"
          className="form-input"
          placeholder="Add a comment…"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={500}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={posting || !text.trim()}
        >
          {posting ? '…' : 'Post'}
        </button>
      </form>
    </div>
  )
}
