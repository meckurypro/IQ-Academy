// src/components/Footer.jsx
import { Link } from 'react-router-dom'

const linkStyle = { color: 'var(--text-dim)', fontSize: 13, fontWeight: 600 }

export default function Footer() {
  return (
    <footer>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/classes" style={linkStyle}>Classes</Link>
          <Link to="/programs" style={linkStyle}>Programs</Link>
          <Link to="/trainings" style={linkStyle}>Upcoming Trainings</Link>
          <Link to="/gallery" style={linkStyle}>Past Events</Link>
          <Link to="/reviews" style={linkStyle}>Share a Review</Link>
          <Link to="/contact" style={linkStyle}>Contact Us</Link>
          <Link to="/staff" style={linkStyle}>Staff</Link>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>
         IQ Academy — Subsidiary of <a href="https://promptiq.com.ng" style={{ color: 'var(--violet-soft)' }}>PromptIQ</a>. © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  )
}
