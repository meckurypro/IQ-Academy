// src/components/Testimonials.jsx
import { useEffect, useRef, useState } from 'react'
import Reveal from './Reveal'

const AUTOPLAY_MS = 5500

export default function Testimonials({ testimonials }) {
  const [active, setActive] = useState(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    if (!testimonials || testimonials.length < 2) return
    const timer = setInterval(() => {
      if (!pausedRef.current) {
        setActive((prev) => (prev + 1) % testimonials.length)
      }
    }, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [testimonials])

  if (!testimonials || testimonials.length === 0) return null

  return (
    <section id="testimonials">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">From the cohort</span>
          <h2>What trainees say.</h2>
        </Reveal>
        <div
          className="testimonial-track"
          onMouseEnter={() => (pausedRef.current = true)}
          onMouseLeave={() => (pausedRef.current = false)}
        >
          {testimonials.map((t, i) => (
            <div
              key={t.id ?? i}
              className={`testimonial-slide${i === active ? ' is-active' : ''}`}
              aria-hidden={i !== active}
            >
              <div className="testimonial-card">
                <p className="quote">"{t.quote}"</p>
                <p className="who">{t.name}{t.context ? ` — ${t.context}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="testimonial-dots">
          {testimonials.map((t, i) => (
            <button
              key={t.id ?? i}
              className={`testimonial-dot${i === active ? ' is-active' : ''}`}
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
