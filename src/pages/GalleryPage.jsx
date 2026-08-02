// src/pages/GalleryPage.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function GalleryPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('academy_trainings')
      .select('*, academy_media(*)')
      .eq('status', 'past')
      .order('training_date', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error('Failed to load past events:', error)
        setEvents(data || [])
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  return (
    <section style={{ paddingTop: 40 }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">The record</span>
          <h2>Past events.</h2>
          <p>Photos and clips from trainings we've actually run — proof this is active, not aspirational.</p>
        </div>

        {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

        {!loading && events.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>Nothing posted yet — check back soon.</p>
        )}

        {events.map((event) => (
          <div key={event.id} style={{ marginBottom: 56 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 6 }}>{event.title}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 18 }}>
              {event.training_date ? new Date(event.training_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              {event.location ? ` · ${event.location}` : ''}
            </p>
            {event.description && (
              <p style={{ color: 'var(--paper-dim)', fontSize: 15, lineHeight: 1.65, marginBottom: 18, maxWidth: 620 }}>
                {event.description}
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {(event.academy_media || []).map((m) => (
                <div key={m.id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--panel-line)', aspectRatio: '4/3' }}>
                  {m.media_type === 'video' ? (
                    <video src={m.url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={m.url} alt={m.caption || event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
