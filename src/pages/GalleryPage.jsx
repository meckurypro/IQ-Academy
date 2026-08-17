// src/pages/GalleryPage.jsx
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// ── Single media item inside the carousel ──────────────────────
// Images render directly. Videos render paused (showing their first
// frame) with a play button overlay; tapping it reveals native
// controls and starts playback.
function MediaItem({ media }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  const handlePlay = () => {
    setPlaying(true)
    // wait a tick for the controls to mount, then start playback
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {})
    })
  }

  return (
    <div
      style={{
        position: 'relative',
        flex: '0 0 82%',
        maxWidth: 420,
        scrollSnapAlign: 'start',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--panel-line)',
        aspectRatio: '4/3',
        background: '#000',
      }}
    >
      {media.media_type === 'video' ? (
        <>
          <video
            ref={videoRef}
            src={media.url}
            poster={media.poster_url || undefined}
            preload="metadata"
            playsInline
            controls={playing}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {!playing && (
            <button
              onClick={handlePlay}
              aria-label="Play video"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)', border: '2px solid rgba(255,255,255,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
                  <path d="M2 2.5C2 1.06 3.57 0.17 4.82 0.9L18.4 8.9C19.62 9.62 19.62 11.38 18.4 12.1L4.82 20.1C3.57 20.83 2 19.94 2 18.5V2.5Z" fill="white" />
                </svg>
              </span>
            </button>
          )}
        </>
      ) : (
        <img
          src={media.url}
          alt={media.caption || ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </div>
  )
}

// ── One event: header + swipeable media carousel ────────────────
function EventCard({ event }) {
  const allMedia = event.academy_media || []
  const thumb = allMedia.find((m) => m.id === event.thumbnail_media_id)
  // thumbnail (if set) leads the carousel; the rest follow in sort_order
  const orderedMedia = thumb
    ? [thumb, ...allMedia.filter((m) => m.id !== thumb.id)]
    : allMedia

  return (
    <div style={{ marginBottom: 56 }}>
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

      {orderedMedia.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: 6,
            // hide scrollbar while keeping native touch/swipe + drag scroll
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {orderedMedia.map((m) => (
            <MediaItem key={m.id} media={m} />
          ))}
        </div>
      )}
      {orderedMedia.length > 1 && (
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
          Swipe to see more · {orderedMedia.length} files
        </p>
      )}
    </div>
  )
}

export default function GalleryPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // NOTE: academy_trainings has TWO relationships to academy_media
    // (academy_media.training_id -> academy_trainings.id, and
    // academy_trainings.thumbnail_media_id -> academy_media.id), so the
    // embed must name the FK explicitly or PostgREST throws PGRST201.
    supabase
      .from('academy_trainings')
      .select('*, academy_media!academy_media_training_id_fkey(*)')
      .eq('status', 'past')
      .order('training_date', { ascending: false })
      .order('sort_order', { foreignTable: 'academy_media', ascending: true })
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
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}
