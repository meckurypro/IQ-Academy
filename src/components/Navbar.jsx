// src/components/Navbar.jsx
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'

const LINKS = [
  { to: '/programs', label: 'Programs' },
  { to: '/trainings', label: 'Upcoming Trainings' },
  { to: '/gallery', label: 'Past Events' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <div className="nav">
      <div className="nav-inner container">
        <Link to="/" className="nav-logo" onClick={() => setOpen(false)}>
          <Logo />
          <span>Academy</span>
        </Link>

        <nav className="nav-links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="nav-right">
          <Link to="/contact" className="nav-cta">Contact Us</Link>
          <button
            className={`hamburger${open ? ' is-open' : ''}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      <div className={`mobile-drawer${open ? ' is-open' : ''}`}>
        <nav className="mobile-links" onClick={() => setOpen(false)}>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
          ))}
          <NavLink to="/contact">Contact Us</NavLink>
        </nav>
      </div>
    </div>
  )
}
