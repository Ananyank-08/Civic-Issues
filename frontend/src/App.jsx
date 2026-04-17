import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Layout/Navbar'
import ProtectedRoute from './components/Layout/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import MapPage from './pages/MapPage'
import SubmitPage from './pages/SubmitPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import MismatchPage from './pages/MismatchPage'
import DepartmentDashboard from './pages/DepartmentDashboard'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import { Toaster } from 'react-hot-toast'

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A35',
            color: '#F1F0FF',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '0.9rem',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#1A1A35' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#1A1A35' } },
        }}
      />

      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Citizen */}
        <Route path="/submit" element={
          <ProtectedRoute allowedRoles={['citizen']}><SubmitPage /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['citizen']}><DashboardPage /></ProtectedRoute>
        } />

        {/* Department */}
        <Route path="/department" element={
          <ProtectedRoute allowedRoles={['DEPARTMENT_STAFF', 'admin']}>
            <DepartmentDashboard />
          </ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
        } />
        <Route path="/admin/mismatches" element={
          <ProtectedRoute adminOnly><MismatchPage /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
