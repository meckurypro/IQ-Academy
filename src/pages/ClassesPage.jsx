// src/pages/ClassesPage.jsx
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { CLASSES_URL, COURSES, FACTS, PACKS, PATHWAYS, STEPS } from '../lib/classes'
import '../classes.css'

export default function ClassesPage() {
  return (
    <>
      <header className="cl-hero">
        <div className="container">
          <span className="eyebrow">Physical classes</span>
          <h1>Learn in a real classroom, <em>near you.</em></h1>
          <p className="cl-lede">
            IQ Academy teaches practical AI skills in person, at partner centres.
            Understand the problem, use the tools, then build something that solves it.
          </p>
          <div className="pc-actions">
            <a href={CLASSES_URL} className="btn-primary">Find a class near you</a>
            <Link to="/contact" className="text-link">Questions? Talk to us →</Link>
          </div>
          <ul className="facts">
            {FACTS.map((f) => (
              <li className="fact" key={f.label}>
                <b>{f.big}</b>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <section>
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Three steps to your first class.</h2>
          </Reveal>
          <div className="steps">
            {STEPS.map((s, i) => (
              <Reveal className="program-card" key={s.title} delay={i * 80}>
                <span className="step-n">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Packs</span>
            <h2>Two ways to enrol.</h2>
            <p>Priced by the number of courses and weeks, so you can start small and come back for the next stage.</p>
          </Reveal>
          <div className="packs-grid">
            {PACKS.map((p, i) => (
              <Reveal className="program-card" key={p.name} delay={i * 80}>
                <span className="program-tag">{p.name}</span>
                <span className="pack-price">{p.price}</span>
                <h3>{p.courses} courses · {p.weeks} weeks</h3>
                <p>{p.note}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Courses</span>
            <h2>{COURSES.length} courses, one way of thinking.</h2>
            <p>Understand, design, build, integrate, automate, architect. Everyone starts with AI Foundations, then branches into a path.</p>
          </Reveal>
          <div className="course-grid">
            {COURSES.map((c, i) => (
              <Reveal className="course" key={c.code} delay={(i % 2) * 80}>
                <span className="course-n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{c.title}{c.start && <span className="tag">Start here</span>}</h3>
                <p>{c.blurb}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="paths">
            {PATHWAYS.map((p) => (
              <div className="path" key={p.name}>
                <b>{p.name}</b>
                <span>
                  {p.steps.map((s, i) => (
                    <span key={s}>{i > 0 && <i>→</i>}{s}</span>
                  ))}
                </span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section>
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">What you leave with</span>
            <h2>Capability, not just a certificate.</h2>
          </Reveal>
          <Reveal as="ul" className="outcomes">
            <li>
              <b>Something you built.</b>
              <span>A project, product, workflow, film or agent. Completion means showing what you made, not only turning up.</span>
            </li>
            <li>
              <b>A certificate that names your path.</b>
              <span>It lists the courses you actually completed, for example AI Foundations + Product Design &amp; UI/UX.</span>
            </li>
          </Reveal>
        </div>
      </section>

      <section style={{ paddingTop: 8 }}>
        <div className="container">
          <Reveal className="teaser">
            <div className="teaser-info">
              <span className="eyebrow">Ready?</span>
              <h3>Pick your courses and find a centre near you.</h3>
              <p>Enrolment happens in the IQ Academy app.</p>
            </div>
            <a href={CLASSES_URL} className="btn-primary">Find a class near you</a>
          </Reveal>
        </div>
      </section>
    </>
  )
}
