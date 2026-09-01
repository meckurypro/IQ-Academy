// src/pages/Home.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Hero from '../components/Hero'
import Programs from '../components/Programs'
import NextTrainingTeaser from '../components/NextTrainingTeaser'
import EventHighlight from '../components/EventHighlight'
import AffiliateCTA from '../components/AffiliateCTA'
import ChatScreenshots from '../components/ChatScreenshots'
import ReviewsCarousel from '../components/ReviewsCarousel'

// Reviews are sorted alphabetically by the first word of their content
// (not by name or date) — this matches the same rule used on Parish25's
// homepage, since both read the same academy_testimonials table (the
// old admin-only "Testimonials" section and the newer public-submission
// "Reviews" feature were merged into this one table — see
// merge_reviews_into_testimonials.sql).
function firstWord(text) {
  return (text || '').trim().match(/^\S+/)?.[0]?.toLowerCase() || ''
}

export default function Home() {
  const [nextTraining, setNextTraining] = useState(null)
  const [recentEvent, setRecentEvent] = useState(null)
  const [chatScreenshots, setChatScreenshots] = useState([])
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let active = true
    supabase
      .from('academy_trainings')
      .select('*')
      .eq('status', 'upcoming')
      .order('training_date', { ascending: true })
      .limit(1)
      .then(({ data, error }) => {
        if (!active) return
        if (error) { console.error('Failed to load next training:', error); return }
        if (data && data[0]) {
          setNextTraining({
            title: data[0].title,
            date: data[0].training_date
              ? new Date(data[0].training_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Date TBA',
            location: data[0].location || 'Location TBA',
          })
        }
      })
    // NOTE: academy_trainings has TWO relationships to academy_media
    // (academy_media.training_id -> academy_trainings.id, and
    // academy_trainings.thumbnail_media_id -> academy_media.id), so the
    // embed must name the FK explicitly or PostgREST throws PGRST201.
    supabase
      .from('academy_trainings')
      .select('*, academy_media!academy_media_training_id_fkey(*)')
      .eq('status', 'past')
      .order('training_date', { ascending: false })
      .order('sort_order', { foreignTable: 'academy_media', ascending: true })
      .limit(1)
      .then(({ data, error }) => {
        if (!active) return
        if (error) { console.error('Failed to load recent event:', error); return }
        const event = data && data[0]
        if (event) {
          const media = event.academy_media || []
          const thumb = media.find((m) => m.id === event.thumbnail_media_id)
          const firstImage = thumb || media.find((m) => m.media_type === 'image')
          setRecentEvent({
            title: event.title,
            description: event.description,
            image: firstImage?.url || null,
          })
        }
      })
    supabase
      .from('academy_chat_screenshots')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) { console.error('Failed to load chat screenshots:', error); return }
        setChatScreenshots(data || [])
      })
    // training_id -> academy_trainings has only one relationship from
    // academy_testimonials, so no explicit FK name is needed for the embed.
    supabase
      .from('academy_testimonials')
      .select('id, name, occupation, location, content, is_private_mentorship, academy_trainings(title)')
      .eq('is_published', true)
      .then(({ data, error }) => {
        if (!active) return
        if (error) { console.error('Failed to load reviews:', error); return }
        const sorted = [...(data || [])].sort((a, b) => firstWord(a.content).localeCompare(firstWord(b.content)))
        setReviews(sorted)
      })
    return () => { active = false }
  }, [])

  return (
    <>
      <Hero />
      <Programs />
      {nextTraining && <NextTrainingTeaser training={nextTraining} />}
      <ChatScreenshots screenshots={chatScreenshots} />
      {recentEvent?.image && <EventHighlight event={recentEvent} />}
      <AffiliateCTA />
      <ReviewsCarousel reviews={reviews} />
    </>
  )
}
