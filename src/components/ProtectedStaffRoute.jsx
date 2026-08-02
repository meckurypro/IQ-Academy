// src/components/ProtectedStaffRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedStaffRoute({ children }) {
  const { user, isStaff, loading } = useAuth()

  if (loading) {
    return (
      <section style={{ paddingTop: 80, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Checking access…</p>
      </section>
    )
  }

  if (!user) return <Navigate to="/staff" replace />
  if (!isStaff) return <Navigate to="/" replace />

  return children
}

