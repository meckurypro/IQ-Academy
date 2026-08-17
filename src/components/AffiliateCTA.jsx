// src/components/AffiliateCTA.jsx
import { useEffect, useState } from 'react'

// Number lives only inside this href — never rendered as visible text
// on the page. Note: it's still present in the page's HTML source
// (unavoidable for a real WhatsApp deep link); if that needs to be
// hidden too, route this through a server-side redirect instead.
const AFFILIATE_WHATSAPP_NUMBER = '2348162465247'
const AFFILIATE_MESSAGE = "Hi! I'd like to learn more about becoming an IQ Academy affiliate partner."
const AFFILIATE_WHATSAPP_URL = `https://wa.me/${AFFILIATE_WHATSAPP_NUMBER}?text=${encodeURIComponent(AFFILIATE_MESSAGE)}`

export default function AffiliateCTA() {
  const [open, setOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Esc closes the modal too, standard modal behavior
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  // reset the inner "see how it works" state whenever the modal closes,
  // so it always reopens fresh
  useEffect(() => {
    if (!open) setShowDetails(false)
  }, [open])

  return (
    <section style={{ paddingTop: 8, paddingBottom: 48 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
        {/* Trigger label — identical markup/position whether the modal is open or closed */}
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            position: 'relative',
            zIndex: 1001, // stays above the blurred backdrop so it's always visible + clickable
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 2px',
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            fontWeight: 600,
          }}
        >
          Partner with us
        </button>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--panel-line)',
              borderRadius: 14,
              padding: '24px 28px',
              maxWidth: 680,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <p style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--violet-soft)', marginBottom: 8, fontWeight: 600 }}>
              Partner with us
            </p>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, marginBottom: 8 }}>
              Know a business, school, or community that could use this?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--paper-dim)', lineHeight: 1.6, marginBottom: showDetails ? 16 : 0 }}>
              This isn't about joining a training — it's about someone you know who could use one.
              Introduce us, and if it turns into a cohort, you earn a share of the value you helped bring in.
            </p>

            {showDetails && (
              <div style={{ marginBottom: 18 }}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
                  <li style={{ fontSize: 14, color: 'var(--paper-dim)', lineHeight: 1.6, display: 'flex', gap: 10 }}>
                    <span style={{ color: 'var(--violet-soft)' }}>—</span>
                    You don't teach, manage, or commit to anything.
                  </li>
                  <li style={{ fontSize: 14, color: 'var(--paper-dim)', lineHeight: 1.6, display: 'flex', gap: 10 }}>
                    <span style={{ color: 'var(--violet-soft)' }}>—</span>
                    You simply make the introduction — a church, school, workplace, or business that could benefit from practical AI training.
                  </li>
                  <li style={{ fontSize: 14, color: 'var(--paper-dim)', lineHeight: 1.6, display: 'flex', gap: 10 }}>
                    <span style={{ color: 'var(--violet-soft)' }}>—</span>
                    If they say yes and the cohort runs, you're paid your share once it's delivered.
                  </li>
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: showDetails ? 4 : 14 }}>
              <button
                onClick={() => setShowDetails((v) => !v)}
                style={{ background: 'none', border: 'none', color: 'var(--violet-soft)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                {showDetails ? 'Show less' : 'See how it works →'}
              </button>

              {showDetails && (
                <a
                  href={AFFILIATE_WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  Become an Affiliate
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
