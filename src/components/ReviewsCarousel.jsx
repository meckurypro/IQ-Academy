// src/components/ReviewsCarousel.jsx
// Swipeable strip of published reviews. Fed by Home.jsx (see the
// firstWord-sorted fetch there) — this component just renders what
// it's given, so Parish25's homepage can reuse the same fetch/sort
// logic against its own light-theme version of this component.

export default function ReviewsCarousel({ reviews }) {
  if (!reviews || reviews.length === 0) return null

  return (
    <section id="reviews" style={{ padding: '56px 0' }}>
      <div className="container">
        <span className="eyebrow">In their words</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '10px 0 6px' }}>
          Student reviews.
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 24, maxWidth: 480 }}>
          From people who've actually gone through a cohort or private mentorship — swipe to read more.
        </p>
        <div className="reviews-track">
          {reviews.map((r) => (
            <div className="review-card" key={r.id}>
              <p className="review-quote">&ldquo;{r.content}&rdquo;</p>
              <p className="review-meta-name">{r.name}</p>
              {(r.occupation || r.location) && (
                <p className="review-meta-sub">
                  {[r.occupation, r.location].filter(Boolean).join(' · ')}
                </p>
              )}
              <span className="review-badge">
                {r.is_private_mentorship ? 'Private mentorship' : (r.academy_trainings?.title || 'Cohort')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
