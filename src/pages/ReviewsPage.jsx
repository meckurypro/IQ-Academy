// src/pages/ReviewsPage.jsx
// Public review submission form. Route this at /reviews.
// Anyone can submit — it publishes immediately (see academy_reviews_migration.sql,
// the INSERT policy forces is_published = true and is_admin_authored = false
// for anon submissions, so there's no approval step and no way around it).

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PRIVATE_MENTORSHIP = 'PRIVATE_MENTORSHIP'

const inputStyle = {
  width: '100%', background: 'var(--panel)', border: '1px solid var(--panel-line)',
  color: 'var(--paper)', padding: '12px 14px', borderRadius: 8, fontSize: 14,
  fontFamily: 'inherit',
}
const labelStyle = { fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }

export default function ReviewsPage() {
  const [trainings, setTrainings] = useState([])
  const [form, setForm] = useState({
    name: '', email: '', location: '', occupation: '', cohort: '', content: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    supabase
      .from('academy_trainings')
      .select('id, title, training_date, status')
      .order('training_date', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('Failed to load trainings:', error); return }
        setTrainings(data || [])
      })
  }, [])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.cohort) {
      setError('Please select a cohort or Private mentorship.')
      return
    }

    setSubmitting(true)

    const { error: insertError } = await supabase.from('academy_reviews').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      location: form.location.trim() || null,
      occupation: form.occupation.trim() || null,
      content: form.content.trim(),
      training_id: form.cohort === PRIVATE_MENTORSHIP ? null : form.cohort,
      is_private_mentorship: form.cohort === PRIVATE_MENTORSHIP,
      // is_published / is_admin_authored are left out entirely — column
      // defaults handle it, and the RLS policy would override any
      // attempt to set them differently anyway.
    })

    setSubmitting(false)

    if (insertError) {
      setError('Something went wrong submitting your review. Please try again.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <section style={{ paddingTop: 60, minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: 480, textAlign: 'center' }}>
          <span className="eyebrow">Review submitted</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '14px 0 12px' }}>
            Thanks, {form.name.split(' ')[0] || 'there'}.
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.65 }}>
            Your review is live on the site now — no waiting on approval.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section style={{ paddingTop: 60 }}>
      <div className="container" style={{ maxWidth: 560 }}>
        <span className="eyebrow">Tell us about it</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '14px 0 12px' }}>
          Share a review
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.65, marginBottom: 30, maxWidth: 480 }}>
          Went through a cohort or private mentorship with us? Tell people what it was actually
          like — it goes live on the site the moment you submit it.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input type="text" required value={form.name} onChange={update('name')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" required value={form.email} onChange={update('email')} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Location</label>
              <input type="text" value={form.location} onChange={update('location')} style={inputStyle} placeholder="e.g. Lagos, Nigeria" />
            </div>
            <div>
              <label style={labelStyle}>Occupation</label>
              <input type="text" value={form.occupation} onChange={update('occupation')} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Which did you attend?</label>
            <select required value={form.cohort} onChange={update('cohort')} style={inputStyle}>
              <option value="" disabled>Select one…</option>
              <option value={PRIVATE_MENTORSHIP}>Private mentorship</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}{t.training_date ? ` — ${new Date(t.training_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Your review</label>
            <textarea
              required
              rows={5}
              value={form.content}
              onChange={update('content')}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="What did you learn, and what stood out?"
            />
          </div>

          {error && <p style={{ color: '#ff8888', fontSize: 13 }}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 6, justifySelf: 'start' }}>
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      </div>
    </section>
  )
}
