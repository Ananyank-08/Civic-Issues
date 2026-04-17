import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute({ children, adminOnly = false, allowedRoles = [] }) {
  const { isAuthenticated, user } = useSelector(s => s.auth)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
