// src/pages/Home.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Hero from '../components/Hero'
import Programs from '../components/Programs'
import NextTrainingTeaser from '../components/NextTrainingTeaser'
import Testimonials from '../components/Testimonials'
import EventHighlight from '../components/EventHighlight'
import ChatScreenshots from '../components/ChatScreenshots'

export default function Home() {
  const [nextTraining, setNextTraining] = useState(null)
  const [testimonials, setTestimonials] = useState([])
  const [recentEvent, setRecentEvent] = useState(null)
  const [chatScreenshots, setChatScreenshots] = useState([])

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
    supabase
      .from('academy_testimonials')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) { console.error('Failed to load testimonials:', error); return }
        setTestimonials(
          (data || []).map((t) => ({ id: t.id, quote: t.quote, name: t.name, context: t.context }))
        )
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
    return () => { active = false }
  }, [])

  return (
    <>
      <Hero />
      <Programs />
      {nextTraining && <NextTrainingTeaser training={nextTraining} />}
      <Testimonials testimonials={testimonials} />
      <ChatScreenshots screenshots={chatScreenshots} />
      {recentEvent?.image && <EventHighlight event={recentEvent} />}
    </>
  )
}
