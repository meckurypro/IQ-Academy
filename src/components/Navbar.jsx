// src/components/Navbar.jsx
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'

export default function Navbar() {
  return (
    <div className="nav">
      <div className="nav-inner container">
        <Link to="/" className="nav-logo">
          <Logo />
          <span>IQ Academy</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/programs">Programs</NavLink>
          <NavLink to="/trainings">Upcoming Trainings</NavLink>
          <NavLink to="/gallery">Past Events</NavLink>
        </nav>
        <Link to="/trainings" className="nav-cta">See what's next</Link>
      </div>
    </div>
  )
}

