// src/components/PhysicalClasses.jsx
import { Link } from 'react-router-dom'
import Reveal from './Reveal'
import { CLASSES_URL, FACTS } from '../lib/classes'
import '../classes.css'

export default function PhysicalClasses() {
  return (
    <section id="classes">
      <div className="container">
        <Reveal className="pc-panel">
          <div className="pc-copy">
            <span className="eyebrow">Physical classes</span>
            <h2>Learn in a real classroom, <em>near you.</em></h2>
            <p>
              Hands-on classes, three times a week, at partner centres. You practise,
              build and solve real problems, and leave with something that works.
            </p>
            <div className="pc-actions">
              <a href={CLASSES_URL} className="btn-primary">Find a class near you</a>
              <Link to="/classes" className="text-link">How classes work →</Link>
            </div>
          </div>
          <ul className="facts">
            {FACTS.map((f) => (
              <li className="fact" key={f.label}>
                <b>{f.big}</b>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
