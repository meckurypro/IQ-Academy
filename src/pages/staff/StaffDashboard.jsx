// src/pages/staff/StaffDashboard.jsx
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const inputStyle = {
  width: '100%', background: 'var(--panel)', border: '1px solid var(--panel-line)',
  color: 'var(--paper)', padding: '10px 12px', borderRadius: 6, fontSize: 14,
}
const labelStyle = { fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 5 }
const cardStyle = { padding: '16px 18px', background: 'var(--panel)', border: '1px solid var(--panel-line)', borderRadius: 10 }

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

// Uploads one or more files to the academy-media bucket and inserts a
// matching row per file into academy_media, linked to trainingId.
async function uploadMediaFiles(files, trainingId) {
  for (const file of Array.from(files)) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${trainingId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('academy-media')
      .upload(path, file)
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('academy-media').getPublicUrl(path)
    const mediaType = file.type.startsWith('video') ? 'video' : 'image'

    const { error: insertError } = await supabase.from('academy_media').insert([{
      training_id: trainingId,
      media_type: mediaType,
      url: urlData.publicUrl,
      caption: file.name,
    }])
    if (insertError) throw insertError
  }
}

// Deletes a media row and its underlying file in storage.
async function deleteMedia(media) {
  const { error: dbError } = await supabase.from('academy_media').delete().eq('id', media.id)
  if (dbError) throw dbError

  const marker = '/academy-media/'
  const idx = media.url.indexOf(marker)
  if (idx !== -1) {
    const path = media.url.slice(idx + marker.length)
    await supabase.storage.from('academy-media').remove([path])
  }
}

// ── Events tab (create + manage trainings, with inline media) ─────
function EventsTab() {
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({ title: '', description: '', training_date: '', location: '', format: 'in_person', status: 'upcoming' })
  const [newFiles, setNewFiles] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [uploadingFor, setUploadingFor] = useState(null)
  const newFileInputRef = useRef(null)
  const addMoreInputRefs = useRef({})

  const load = () => {
    supabase
      .from('academy_trainings')
      .select('*, academy_media(*)')
      .order('training_date', { ascending: false })
      .then(({ data, error }) => { if (error) console.error(error); setEvents(data || []) })
  }
  useEffect(load, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await supabase.from('academy_trainings').insert([form]).select('id').single()
    if (error) { setSaving(false); alert('Failed to save: ' + error.message); return }

    if (newFiles && newFiles.length > 0) {
      try {
        await uploadMediaFiles(newFiles, data.id)
      } catch (err) {
        alert('Event saved, but media upload failed: ' + err.message)
      }
    }

    setSaving(false)
    setForm({ title: '', description: '', training_date: '', location: '', format: 'in_person', status: 'upcoming' })
    setNewFiles(null)
    if (newFileInputRef.current) newFileInputRef.current.value = ''
    load()
  }

  const handleDeleteEvent = async (id) => {
    if (!confirm('Delete this event? Its media will be removed too.')) return
    const { error } = await supabase.from('academy_trainings').delete().eq('id', id)
    if (error) { alert('Failed to delete: ' + error.message); return }
    load()
  }

  const handleAddMore = async (eventId, files) => {
    if (!files || files.length === 0) return
    setUploadingFor(eventId)
    try {
      await uploadMediaFiles(files, eventId)
      load()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    setUploadingFor(null)
    if (addMoreInputRefs.current[eventId]) addMoreInputRefs.current[eventId].value = ''
  }

  const handleDeleteMedia = async (media) => {
    if (!confirm('Delete this file?')) return
    try {
      await deleteMedia(media)
      load()
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 14 }}>Create an event</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, maxWidth: 560 }}>
        Works for upcoming trainings or past events. Photos, videos, flyers, or
        promo commercials are optional — you can add them now or later.
      </p>
      <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12, marginBottom: 36, maxWidth: 560 }}>
        <Field label="Title"><input style={inputStyle} required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></Field>
        <Field label="Description"><textarea style={{ ...inputStyle, minHeight: 70 }} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Date"><input type="date" style={inputStyle} value={form.training_date} onChange={(e) => setForm((p) => ({ ...p, training_date: e.target.value }))} /></Field>
          <Field label="Location"><input style={inputStyle} value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Format">
            <select style={inputStyle} value={form.format} onChange={(e) => setForm((p) => ({ ...p, format: e.target.value }))}>
              <option value="in_person">In-person</option>
              <option value="virtual">Virtual</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </Field>
        </div>
        <Field label="Photos / videos (optional — flyers, promo clips, event photos)">
          <input
            ref={newFileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => setNewFiles(e.target.files)}
            style={{ fontSize: 13, color: 'var(--paper-dim)' }}
          />
        </Field>
        <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'fit-content' }}>
          {saving ? 'Saving…' : 'Create event'}
        </button>
      </form>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 14 }}>All events</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {events.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No events yet.</p>}
        {events.map((ev) => {
          const isOpen = expandedId === ev.id
          const media = ev.academy_media || []
          return (
            <div key={ev.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{ev.title}</strong>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
                    {ev.training_date || 'No date'} · {ev.status} · {media.length} file{media.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                  <button onClick={() => setExpandedId(isOpen ? null : ev.id)} style={{ background: 'none', border: 'none', color: 'var(--violet-soft)', fontSize: 13, cursor: 'pointer' }}>
                    {isOpen ? 'Hide media' : 'Manage media'}
                  </button>
                  <button onClick={() => handleDeleteEvent(ev.id)} style={{ background: 'none', border: 'none', color: '#ff8888', fontSize: 13, cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--panel-line)' }}>
                  {media.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10, marginBottom: 14 }}>
                      {media.map((m) => (
                        <div key={m.id} style={{ position: 'relative' }}>
                          <div style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--panel-line)' }}>
                            {m.media_type === 'video' ? (
                              <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <img src={m.url} alt={m.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteMedia(m)}
                            style={{
                              position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                              background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            aria-label="Delete file"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label style={labelStyle}>Add more photos / videos</label>
                  <input
                    ref={(el) => (addMoreInputRefs.current[ev.id] = el)}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    disabled={uploadingFor === ev.id}
                    onChange={(e) => handleAddMore(ev.id, e.target.files)}
                    style={{ fontSize: 13, color: 'var(--paper-dim)' }}
                  />
                  {uploadingFor === ev.id && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Uploading…</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Testimonials tab ────────────────────────────────────────
function TestimonialsTab() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ name: '', context: '', quote: '', is_published: true })
  const [saving, setSaving] = useState(false)

  const load = () => {
    supabase.from('academy_testimonials').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => { if (error) console.error(error); setRows(data || []) })
  }
  useEffect(load, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('academy_testimonials').insert([form])
    setSaving(false)
    if (error) { alert('Failed to save: ' + error.message); return }
    setForm({ name: '', context: '', quote: '', is_published: true })
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this testimonial?')) return
    const { error } = await supabase.from('academy_testimonials').delete().eq('id', id)
    if (error) { alert('Failed to delete: ' + error.message); return }
    load()
  }

  return (
    <div>
      <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12, marginBottom: 32, maxWidth: 520 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Name"><input style={inputStyle} required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Context (e.g. cohort name)"><input style={inputStyle} value={form.context} onChange={(e) => setForm((p) => ({ ...p, context: e.target.value }))} /></Field>
        </div>
        <Field label="Quote"><textarea style={{ ...inputStyle, minHeight: 70 }} required value={form.quote} onChange={(e) => setForm((p) => ({ ...p, quote: e.target.value }))} /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--paper-dim)' }}>
          <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))} />
          Published (visible on site)
        </label>
        <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'fit-content' }}>{saving ? 'Saving…' : 'Add testimonial'}</button>
      </form>

      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--panel)', border: '1px solid var(--panel-line)', borderRadius: 8 }}>
            <div>
              <strong style={{ fontSize: 14 }}>{r.name}</strong>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>{r.is_published ? 'Published' : 'Hidden'} · {r.quote.slice(0, 60)}{r.quote.length > 60 ? '…' : ''}</p>
            </div>
            <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#ff8888', fontSize: 13, cursor: 'pointer' }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard shell ──────────────────────────────────────────
export default function StaffDashboard() {
  const { profile, signOut } = useAuth()
  const [tab, setTab] = useState('events')

  return (
    <section style={{ paddingTop: 40 }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <span className="eyebrow">Staff</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '10px 0' }}>
              Manage IQ Academy
            </h2>
          </div>
          <button onClick={signOut} className="btn-outline">Sign out</button>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>
          Signed in as {profile?.username || profile?.display_name || 'staff'}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { id: 'events', label: 'Events' },
            { id: 'testimonials', label: 'Testimonials' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none',
                background: tab === t.id ? 'var(--violet)' : 'var(--panel)',
                color: tab === t.id ? '#fff' : 'var(--paper-dim)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'events' && <EventsTab />}
        {tab === 'testimonials' && <TestimonialsTab />}
      </div>
    </section>
  )
}
