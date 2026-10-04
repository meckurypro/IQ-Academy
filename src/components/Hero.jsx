// src/components/Hero.jsx
import { Link } from 'react-router-dom'
import { LOGO_URL } from './Logo'
import { CLASSES_URL } from '../lib/classes'

// Hero-only image — decoupled from LOGO_URL so navbar/favicon stay untouched
// when this changes.
const HERO_IMAGE_URL = 'https://raw.githubusercontent.com/meckurypro/PromptIQ-/main/public/iqacademy.png'

export default function Hero() {
  return (
    <header className="hero">
      <div className="container hero-grid">
        <div>
          <h1>
            AI education, built <span className="accent">around how people actually learn.</span>
          </h1>
          <p className="lede">
            IQ Academy is PromptIQ's education arm — hands-on classes in a real
            classroom, cohort workshops, one-on-one mentorship and internships.
            Practical skills, taught by people actively building with AI, not
            reading about it.
          </p>
          <div className="hero-btns">
            <a href={CLASSES_URL} className="btn-primary">Find a class near you</a>
            <Link to="/programs" className="btn-outline">Explore programs</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-visual-panel">
            <img src={HERO_IMAGE_URL} alt="IQ Academy" />
          </div>
        </div>
      </div>
    </header>
  )
}
