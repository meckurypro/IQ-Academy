// src/pages/Home.jsx
import Hero from '../components/Hero'
import Programs from '../components/Programs'
import NextTrainingTeaser from '../components/NextTrainingTeaser'
import Testimonials from '../components/Testimonials'
import EventHighlight from '../components/EventHighlight'

// Placeholder data — will be replaced with live Supabase queries
// (academy_trainings / academy_testimonials / academy_events) once
// the staff dashboard is wired up.
const nextTraining = {
  title: 'AI Literacy for Community Leaders',
  date: 'Coming soon',
  location: 'Lagos, Nigeria',
}

const testimonials = [
  {
    id: 1,
    quote: "I walked in confused about what AI even was for. I walked out having built my first automation.",
    name: 'Cohort participant',
    context: "St Anne's AI Training",
  },
  {
    id: 2,
    quote: 'Practical, not theoretical. Every session ended with something I could actually use.',
    name: 'Cohort participant',
    context: "St Anne's AI Training",
  },
]

const recentEvent = {
  title: "Church AI Training — St Anne's",
  description:
    "A hands-on AI literacy session for the St Anne's congregation — covering foundational AI understanding and practical, everyday applications. Part of PromptIQ's ongoing community workshop series.",
  image: 'https://picsum.photos/seed/iq-academy-stannes/900/700',
}

export default function Home() {
  return (
    <>
      <Hero />
      <Programs />
      <NextTrainingTeaser training={nextTraining} />
      <Testimonials testimonials={testimonials} />
      <EventHighlight event={recentEvent} />
    </>
  )
}

