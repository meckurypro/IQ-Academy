// src/components/Hero.jsx
export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-glow" />
      <div className="container hero-content">
        <div className="live-pill">
          <span className="dot" />
          Ongoing cohorts &amp; coaching — actively training now
        </div>
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
    </header>
  )
}
