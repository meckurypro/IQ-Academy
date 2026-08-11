// src/components/Programs.jsx
import Reveal from './Reveal'

const INTERNSHIP_URL = 'https://internship.promptiq.com.ng/'

const programs = [
  {
    tag: 'Cohorts',
    name: 'Community Workshops',
    desc: 'Cohort-based AI literacy for churches, schools, and workplace teams — practical skills, no jargon.',
  },
  {
    tag: 'Mentorship',
    name: '1:1 Coaching',
    desc: 'One-on-one guidance for individuals building real AI skills at their own pace.',
  },
  {
    tag: 'Internships',
    name: 'Creator Internship',
    desc: 'Learn by doing — work directly on live PromptIQ productions while you train.',
    href: INTERNSHIP_URL,
    linkLabel: 'View internship →',
    external: true,
  },
  {
    tag: 'Consultations',
    name: 'Quick Clarity Calls',
    desc: "A focused one-hour call to demystify AI confusion for creators and brands.",
  },
]

export default function Programs() {
  return (
    <section id="programs">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">What we teach</span>
          <h2>Four ways to learn.</h2>
          <p>
            Whether you're a community, an individual, or a brand that just
            needs one clear answer — there's a format built for it.
          </p>
        </Reveal>
        <div className="programs-grid">
          {programs.map((p, i) => (
            <Reveal as="div" className="program-card" key={p.tag} delay={i * 80}>
              <span className="program-tag">{p.tag}</span>
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
              {p.href && (
                <a
                  className="program-link"
                  href={p.href}
                  target={p.external ? '_blank' : undefined}
                  rel={p.external ? 'noreferrer' : undefined}
                >
                  {p.linkLabel}
                </a>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
