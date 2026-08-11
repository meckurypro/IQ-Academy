// src/components/Hero.jsx
import { LOGO_URL } from './Logo'

export default function Hero() {
  return (
    <header className="hero">
      <div className="container hero-grid">
        <div>
          <h1>
            AI education, built <span className="accent">around how people actually learn.</span>
          </h1>
          <p className="lede">
            IQ Academy is PromptIQ's education arm — cohort workshops, one-on-one
            mentorship, hands-on internships, and quick consultations. Practical
            skills, taught by people actively building with AI, not reading
            about it.
          </p>
          <div className="hero-btns">
            <a href="/trainings" className="btn-primary">See upcoming trainings</a>
            <a href="/programs" className="btn-outline">Explore programs</a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-panel">
            <img src={LOGO_URL} alt="IQ Academy" />
          </div>
        </div>
      </div>
    </header>
  )
}
