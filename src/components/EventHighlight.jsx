// src/components/EventHighlight.jsx
import Reveal from './Reveal'

export default function EventHighlight({ event }) {
  if (!event) return null
  return (
    <section id="recent-event">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Just concluded</span>
          <h2>{event.title}</h2>
        </Reveal>
        <Reveal className="event-highlight" delay={100}>
          <img src={event.image} alt={event.title} />
          <div>
            <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.7, marginBottom: 18 }}>
              {event.description}
            </p>
            <a href="/gallery" className="btn-outline">See the full gallery</a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
