// src/pages/TrainingsPage.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('academy_trainings')
      .select('*')
      .eq('status', 'upcoming')
      .order('training_date', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error('Failed to load trainings:', error)
        setTrainings(data || [])
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  return (
    <section style={{ paddingTop: 40 }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">What's coming up</span>
          <h2>Upcoming trainings.</h2>
          <p>New cohorts, community workshops, and sessions get posted here as they're scheduled.</p>
        </div>

        {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

        {!loading && trainings.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>
            Nothing scheduled right now — check back soon, or reach out on{' '}
            <a href="https://promptiq.com.ng#contact" style={{ color: 'var(--violet-soft)' }}>promptiq.com.ng</a>{' '}
            to ask about the next cohort.
          </p>
        )}

        <div className="programs-grid">
          {trainings.map((t) => (
            <div className="program-card" key={t.id}>
              <span className="program-tag">
                {t.training_date ? new Date(t.training_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBA'}
              </span>
              <h3>{t.title}</h3>
              <p>{t.description}</p>
              {t.location && <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t.location}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
