// src/components/ChatScreenshots.jsx
//
// Public "community chatter" strip — real WhatsApp screenshots as
// unfiltered social proof, distinct from the polished, on-brand
// academy_testimonials quotes. Horizontal swipeable strip with a
// lightbox for a closer look, same pattern as the past-events gallery
// carousel but without video/thumbnail complexity.
import { useEffect, useState } from 'react'

export default function ChatScreenshots({ screenshots }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const close = () => setLightboxIndex(null)
  const showPrev = () => setLightboxIndex((i) => (i > 0 ? i - 1 : screenshots.length - 1))
  const showNext = () => setLightboxIndex((i) => (i < screenshots.length - 1 ? i + 1 : 0))

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') showPrev()
      if (e.key === 'ArrowRight') showNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, screenshots.length])

  if (!screenshots || screenshots.length === 0) return null

  return (
    <section style={{ padding: '56px 0' }}>
      <div className="container">
        <span className="eyebrow">Community</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '10px 0 24px' }}>
          What people are saying
        </h2>

        <div
          style={{
            display: 'flex',
            gap: 14,
            overflowX: 'auto',
            paddingBottom: 8,
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {screenshots.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setLightboxIndex(idx)}
              style={{
                flex: '0 0 auto', width: 220, scrollSnapAlign: 'start',
                background: 'var(--panel)', border: '1px solid var(--panel-line)',
                borderRadius: 12, overflow: 'hidden', cursor: 'pointer', padding: 0,
              }}
            >
              <img
                src={s.image_url}
                alt={s.caption || 'Community feedback screenshot'}
                loading="lazy"
                style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
              />
              {s.caption && (
                <p style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 10px', margin: 0, textAlign: 'left' }}>
                  {s.caption}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); close() }}
            aria-label="Close"
            style={{
              position: 'absolute', top: 20, right: 24, width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', fontSize: 18, cursor: 'pointer',
            }}
          >
            ×
          </button>

          {screenshots.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showPrev() }}
              aria-label="Previous"
              style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
                color: '#fff', border: 'none', fontSize: 20, cursor: 'pointer',
              }}
            >
              ‹
            </button>
          )}

          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, width: '100%' }}>
            <img
              src={screenshots[lightboxIndex].image_url}
              alt={screenshots[lightboxIndex].caption || 'Community feedback screenshot'}
              style={{ width: '100%', borderRadius: 12, display: 'block' }}
            />
            {screenshots[lightboxIndex].caption && (
              <p style={{ color: 'var(--paper-dim)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
                {screenshots[lightboxIndex].caption}
              </p>
            )}
          </div>

          {screenshots.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showNext() }}
              aria-label="Next"
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
                color: '#fff', border: 'none', fontSize: 20, cursor: 'pointer',
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </section>
  )
}
