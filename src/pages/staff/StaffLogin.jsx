// src/pages/staff/StaffLogin.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function StaffLogin() {
  const { user, profile, isStaff, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in — route based on staff status
  useEffect(() => {
    if (loading || !user) return
    if (isStaff) navigate('/staff/dashboard')
    else navigate('/')
  }, [loading, user, isStaff, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: signInError } = await signIn(email, password)
    setSubmitting(false)
    if (signInError) setError('Incorrect email or password.')
    // On success, the useEffect above handles redirect once
    // profile/isStaff resolves.
  }

  return (
    <section style={{ paddingTop: 60, minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: 420 }}>
        <span className="eyebrow">Staff access</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '14px 0 24px' }}>Sign in</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%', background: 'var(--panel)', border: '1px solid var(--panel-line)',
                color: 'var(--paper)', padding: '12px 14px', borderRadius: 8, fontSize: 14,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', background: 'var(--panel)', border: '1px solid var(--panel-line)',
                color: 'var(--paper)', padding: '12px 14px', borderRadius: 8, fontSize: 14,
              }}
            />
          </div>
          {error && <p style={{ color: '#ff8888', fontSize: 13 }}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 6 }}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 20 }}>
          Same login as Meckury AI. No signup here — access is granted by staff role.
        </p>
      </div>
    </section>
  )
}

