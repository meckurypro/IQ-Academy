// src/components/Footer.jsx
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/programs" style={{ color: 'var(--text-dim)', fontSize: 13, fontWeight: 600 }}>Programs</Link>
          <Link to="/trainings" style={{ color: 'var(--text-dim)', fontSize: 13, fontWeight: 600 }}>Upcoming Trainings</Link>
          <Link to="/gallery" style={{ color: 'var(--text-dim)', fontSize: 13, fontWeight: 600 }}>Past Events</Link>
          <Link to="/contact" style={{ color: 'var(--text-dim)', fontSize: 13, fontWeight: 600 }}>Contact Us</Link>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>
         IQ Academy — Subsidiary of <a href="https://promptiq.com.ng" style={{ color: 'var(--violet-soft)' }}>PromptIQ</a>. © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  )
}
