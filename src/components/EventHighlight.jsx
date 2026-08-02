// src/components/EventHighlight.jsx
export default function EventHighlight({ event }) {
  if (!event) return null
  return (
    <section id="recent-event">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Just concluded</span>
          <h2>{event.title}</h2>
        </div>
        <div className="event-highlight">
          <img src={event.image} alt={event.title} />
          <div>
            <p style={{ color: 'var(--paper-dim)', fontSize: 15, lineHeight: 1.7, marginBottom: 18 }}>
              {event.description}
            </p>
            <a href="/gallery" className="btn-outline">See the full gallery</a>
          </div>
        </div>
      </div>
    </section>
  )
}
