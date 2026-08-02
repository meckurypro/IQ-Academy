// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────
// Confirmed against the actual `profiles` schema:
// - is_staff (boolean) — staff flag
// - role (enum, includes 'admin') — admin flag
// Both grant access, per "apart from admin, staff should also access".
// ─────────────────────────────────────────────────────────────
function isStaffOrAdmin(profile) {
  if (!profile) return false
  return profile.is_staff === true || profile.role === 'admin'
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadProfile(data.session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) loadProfile(newSession.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) console.error('Failed to load profile:', error)
    setProfile(data || null)
    setLoading(false)
  }

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isStaff: isStaffOrAdmin(profile),
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
