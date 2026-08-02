// src/components/NextTrainingTeaser.jsx
export default function NextTrainingTeaser({ training }) {
  if (!training) return null
  return (
    <section>
      <div className="container">
        <div className="teaser">
          <div className="teaser-info">
            <span className="eyebrow">Next up</span>
            <h3>{training.title}</h3>
            <p>{training.date} · {training.location}</p>
          </div>
          <a href="/trainings" className="btn-primary">See all trainings</a>
        </div>
      </div>
    </section>
  )
}
