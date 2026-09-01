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

// Captures a single frame from a video File as a JPEG Blob, used as a
// stable poster image so we don't depend on the browser's own
// (inconsistent) default first-frame rendering. Best-effort: resolves
// null instead of throwing if capture isn't possible in this browser.
function captureVideoPosterBlob(file, seekSeconds = 0.5) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = objectUrl

    const cleanup = () => URL.revokeObjectURL(objectUrl)
    const fail = () => { cleanup(); resolve(null) }

    video.addEventListener('loadedmetadata', () => {
      const duration = Number.isFinite(video.duration) ? video.duration : seekSeconds
      video.currentTime = Math.min(seekSeconds, Math.max(0, duration - 0.05))
    })

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => { cleanup(); resolve(blob) }, 'image/jpeg', 0.85)
      } catch {
        fail()
      }
    })

    video.addEventListener('error', fail)
    // safety timeout in case a video never fires seeked (corrupt/unsupported file)
    setTimeout(fail, 8000)
  })
}

// Uploads one or more files to the academy-media bucket and inserts a
// matching row per file into academy_media, linked to trainingId.
// startOrder lets callers append after existing media instead of
// stomping sort_order back to 0. For videos, also captures and
// uploads a poster frame so playback UIs don't rely on browser
// default first-frame rendering.
async function uploadMediaFiles(files, trainingId, startOrder = 0) {
  const fileArr = Array.from(files)
  for (let i = 0; i < fileArr.length; i++) {
    const file = fileArr[i]
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${trainingId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('academy-media')
      .upload(path, file)
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('academy-media').getPublicUrl(path)
    const mediaType = file.type.startsWith('video') ? 'video' : 'image'

    let posterUrl = null
    if (mediaType === 'video') {
      try {
        const posterBlob = await captureVideoPosterBlob(file)
        if (posterBlob) {
          const posterPath = `${trainingId}/${Date.now()}-${safeName}-poster.jpg`
          const { error: posterUploadError } = await supabase.storage
            .from('academy-media')
            .upload(posterPath, posterBlob, { contentType: 'image/jpeg' })
          if (!posterUploadError) {
            const { data: posterUrlData } = supabase.storage.from('academy-media').getPublicUrl(posterPath)
            posterUrl = posterUrlData.publicUrl
          }
        }
      } catch {
        // poster capture is best-effort; fall back to no poster_url
      }
    }

    const { error: insertError } = await supabase.from('academy_media').insert([{
      training_id: trainingId,
      media_type: mediaType,
      url: urlData.publicUrl,
      caption: file.name,
      sort_order: startOrder + i,
      poster_url: posterUrl,
    }])
    if (insertError) throw insertError
  }
}

// Deletes a media row and its underlying file(s) in storage,
// including the poster image if one was generated.
async function deleteMedia(media) {
  const { error: dbError } = await supabase.from('academy_media').delete().eq('id', media.id)
  if (dbError) throw dbError

  const marker = '/academy-media/'
  const pathsToRemove = []

  const urlIdx = media.url.indexOf(marker)
  if (urlIdx !== -1) pathsToRemove.push(media.url.slice(urlIdx + marker.length))

  if (media.poster_url) {
    const posterIdx = media.poster_url.indexOf(marker)
    if (posterIdx !== -1) pathsToRemove.push(media.poster_url.slice(posterIdx + marker.length))
  }

  if (pathsToRemove.length > 0) {
    await supabase.storage.from('academy-media').remove(pathsToRemove)
  }
}

// Strips a storage path out of a public URL for the given bucket, so
// callers can pass it to supabase.storage.from(bucket).remove([...]).
function storagePathFromUrl(url, bucket) {
  const marker = `/${bucket}/`
  const idx = url.indexOf(marker)
  return idx === -1 ? null : url.slice(idx + marker.length)
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

  // drag-reorder tracking
  const dragItemIndex = useRef(null)
  const dragOverIndex = useRef(null)

  // NOTE: academy_trainings has TWO relationships to academy_media now
  // (academy_media.training_id -> academy_trainings.id, and
  // academy_trainings.thumbnail_media_id -> academy_media.id), so the
  // embed must name the FK explicitly or PostgREST throws PGRST201.
  const load = () => {
    supabase
      .from('academy_trainings')
      .select('*, academy_media!academy_media_training_id_fkey(*)')
      .order('training_date', { ascending: false })
      .order('sort_order', { foreignTable: 'academy_media', ascending: true })
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
        await uploadMediaFiles(newFiles, data.id, 0)
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

  const handleAddMore = async (ev, files) => {
    if (!files || files.length === 0) return
    setUploadingFor(ev.id)
    try {
      const startOrder = (ev.academy_media || []).length
      await uploadMediaFiles(files, ev.id, startOrder)
      load()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    setUploadingFor(null)
    if (addMoreInputRefs.current[ev.id]) addMoreInputRefs.current[ev.id].value = ''
  }

  const handleDeleteMedia = async (ev, media) => {
    if (!confirm('Delete this file?')) return
    try {
      await deleteMedia(media)
      // if we just deleted the thumbnail, clear the reference
      if (ev.thumbnail_media_id === media.id) {
        await supabase.from('academy_trainings').update({ thumbnail_media_id: null }).eq('id', ev.id)
      }
      load()
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const handleSetThumbnail = async (ev, mediaId) => {
    const nextId = ev.thumbnail_media_id === mediaId ? null : mediaId // click again to unset
    const { error } = await supabase
      .from('academy_trainings')
      .update({ thumbnail_media_id: nextId })
      .eq('id', ev.id)
    if (error) { alert('Failed to set thumbnail: ' + error.message); return }
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, thumbnail_media_id: nextId } : e)))
  }

  const handleDragStart = (index) => { dragItemIndex.current = index }
  const handleDragEnter = (index) => { dragOverIndex.current = index }

  const handleDragEnd = async (ev) => {
    const from = dragItemIndex.current
    const to = dragOverIndex.current
    dragItemIndex.current = null
    dragOverIndex.current = null
    if (from === null || to === null || from === to) return

    const media = [...(ev.academy_media || [])]
    const [moved] = media.splice(from, 1)
    media.splice(to, 0, moved)

    // optimistic UI update
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, academy_media: media } : e)))

    try {
      await Promise.all(
        media.map((m, idx) =>
          supabase.from('academy_media').update({ sort_order: idx }).eq('id', m.id)
        )
      )
    } catch (err) {
      alert('Failed to save new order: ' + err.message)
      load() // fall back to server truth
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
                    <>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                        Drag to reorder · click ☆ to set the event thumbnail
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10, marginBottom: 14 }}>
                        {media.map((m, idx) => {
                          const isThumb = ev.thumbnail_media_id === m.id
                          return (
                            <div
                              key={m.id}
                              draggable
                              onDragStart={() => handleDragStart(idx)}
                              onDragEnter={() => handleDragEnter(idx)}
                              onDragOver={(e) => e.preventDefault()}
                              onDragEnd={() => handleDragEnd(ev)}
                              style={{ position: 'relative', cursor: 'grab' }}
                            >
                              <div style={{
                                aspectRatio: '1', borderRadius: 6, overflow: 'hidden',
                                border: isThumb ? '2px solid var(--violet)' : '1px solid var(--panel-line)',
                              }}>
                                {m.media_type === 'video' ? (
                                  m.poster_url ? (
                                    <img src={m.poster_url} alt={m.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                                  ) : (
                                    <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  )
                                ) : (
                                  <img src={m.url} alt={m.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteMedia(ev, m)}
                                style={{
                                  position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                                  background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                aria-label="Delete file"
                              >
                                ×
                              </button>
                              <button
                                onClick={() => handleSetThumbnail(ev, m.id)}
                                title={isThumb ? 'Unset thumbnail' : 'Set as thumbnail'}
                                style={{
                                  position: 'absolute', bottom: 4, left: 4, width: 22, height: 22, borderRadius: '50%',
                                  background: 'rgba(0,0,0,0.6)', color: isThumb ? 'var(--violet-soft)' : '#fff',
                                  border: 'none', fontSize: 13, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                aria-label="Set as thumbnail"
                              >
                                {isThumb ? '★' : '☆'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                  <label style={labelStyle}>Add more photos / videos</label>
                  <input
                    ref={(el) => (addMoreInputRefs.current[ev.id] = el)}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    disabled={uploadingFor === ev.id}
                    onChange={(e) => handleAddMore(ev, e.target.files)}
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
// Testimonials can optionally be linked to a cohort/training via a
// dropdown of existing trainings (past or upcoming). Picking one
// auto-fills the "context" field with the training's title, but the
// staff member can still edit context freely afterward.
function TestimonialsTab() {
  const [rows, setRows] = useState([])
  const [trainings, setTrainings] = useState([])
  const [form, setForm] = useState({ name: '', context: '', quote: '', is_published: true, training_id: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    supabase
      .from('academy_testimonials')
      .select('*, academy_trainings(title)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => { if (error) console.error(error); setRows(data || []) })
  }

  const loadTrainings = () => {
    supabase
      .from('academy_trainings')
      .select('id, title, status, training_date')
      .order('training_date', { ascending: false })
      .then(({ data, error }) => { if (error) console.error(error); setTrainings(data || []) })
  }

  useEffect(() => { load(); loadTrainings() }, [])

  const handleCohortChange = (trainingId) => {
    const picked = trainings.find((t) => t.id === trainingId)
    setForm((p) => ({
      ...p,
      training_id: trainingId,
      // only auto-fill context if it's empty or was previously auto-filled
      // from a cohort pick — don't clobber something the staff typed by hand
      context: picked ? picked.title : p.context,
    }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      context: form.context || null,
      quote: form.quote,
      is_published: form.is_published,
      training_id: form.training_id || null,
    }
    const { error } = await supabase.from('academy_testimonials').insert([payload])
    setSaving(false)
    if (error) { alert('Failed to save: ' + error.message); return }
    setForm({ name: '', context: '', quote: '', is_published: true, training_id: '' })
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
          <Field label="Cohort (optional)">
            <select style={inputStyle} value={form.training_id} onChange={(e) => handleCohortChange(e.target.value)}>
              <option value="">— No cohort —</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}{t.training_date ? ` (${t.training_date})` : ''} · {t.status}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Context (auto-filled from cohort, editable)">
          <input style={inputStyle} value={form.context} onChange={(e) => setForm((p) => ({ ...p, context: e.target.value }))} />
        </Field>
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
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
                {r.is_published ? 'Published' : 'Hidden'}
                {r.academy_trainings?.title ? ` · ${r.academy_trainings.title}` : ''} · {r.quote.slice(0, 60)}{r.quote.length > 60 ? '…' : ''}
              </p>
            </div>
            <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#ff8888', fontSize: 13, cursor: 'pointer' }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Chat Screenshots tab ─────────────────────────────────────
// WhatsApp screenshots stored in the existing academy-media bucket
// under a chat-feedback/ folder. Simpler than the Events media
// manager: no per-training scoping, just a flat published/unpublished
// list with drag-reorder, an inline caption, and a publish toggle.
function ScreenshotsTab() {
  const [rows, setRows] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const dragItemIndex = useRef(null)
  const dragOverIndex = useRef(null)

  const load = () => {
    supabase
      .from('academy_chat_screenshots')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => { if (error) console.error(error); setRows(data || []) })
  }
  useEffect(load, [])

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const fileArr = Array.from(files)
      const startOrder = rows.length
      for (let i = 0; i < fileArr.length; i++) {
        const file = fileArr[i]
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `chat-feedback/${Date.now()}-${safeName}`

        const { error: uploadError } = await supabase.storage.from('academy-media').upload(path, file)
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('academy-media').getPublicUrl(path)

        const { error: insertError } = await supabase.from('academy_chat_screenshots').insert([{
          image_url: urlData.publicUrl,
          caption: null,
          is_published: true,
          sort_order: startOrder + i,
        }])
        if (insertError) throw insertError
      }
      load()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (row) => {
    if (!confirm('Delete this screenshot?')) return
    try {
      const { error: dbError } = await supabase.from('academy_chat_screenshots').delete().eq('id', row.id)
      if (dbError) throw dbError
      const path = storagePathFromUrl(row.image_url, 'academy-media')
      if (path) await supabase.storage.from('academy-media').remove([path])
      load()
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const handleTogglePublish = async (row) => {
    const { error } = await supabase
      .from('academy_chat_screenshots')
      .update({ is_published: !row.is_published })
      .eq('id', row.id)
    if (error) { alert('Failed to update: ' + error.message); return }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_published: !r.is_published } : r)))
  }

  const handleCaptionBlur = async (row, value) => {
    if (value === (row.caption || '')) return
    const { error } = await supabase
      .from('academy_chat_screenshots')
      .update({ caption: value || null })
      .eq('id', row.id)
    if (error) alert('Failed to save caption: ' + error.message)
  }

  const handleDragStart = (index) => { dragItemIndex.current = index }
  const handleDragEnter = (index) => { dragOverIndex.current = index }

  const handleDragEnd = async () => {
    const from = dragItemIndex.current
    const to = dragOverIndex.current
    dragItemIndex.current = null
    dragOverIndex.current = null
    if (from === null || to === null || from === to) return

    const next = [...rows]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setRows(next)

    try {
      await Promise.all(next.map((r, idx) => supabase.from('academy_chat_screenshots').update({ sort_order: idx }).eq('id', r.id)))
    } catch (err) {
      alert('Failed to save new order: ' + err.message)
      load()
    }
  }

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 14 }}>Community chat feedback</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, maxWidth: 560 }}>
        WhatsApp screenshots from the community. Crop or blur any phone numbers
        and profile photos before uploading — those are real people's private
        contact info.
      </p>
      <Field label="Upload screenshots">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => handleUpload(e.target.files)}
          style={{ fontSize: 13, color: 'var(--paper-dim)' }}
        />
      </Field>
      {uploading && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Uploading…</p>}

      {rows.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '24px 0 8px' }}>
            Drag to reorder · toggle to publish/hide · caption is optional
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {rows.map((r, idx) => (
              <div
                key={r.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={handleDragEnd}
                style={{ ...cardStyle, padding: 10, cursor: 'grab', opacity: r.is_published ? 1 : 0.55 }}
              >
                <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', marginBottom: 8, aspectRatio: '9/16', background: '#00000022' }}>
                  <img src={r.image_url} alt={r.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                  <button
                    onClick={() => handleDelete(r)}
                    style={{
                      position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    aria-label="Delete screenshot"
                  >
                    ×
                  </button>
                </div>
                <input
                  placeholder="Caption (optional)"
                  defaultValue={r.caption || ''}
                  onBlur={(e) => handleCaptionBlur(r, e.target.value)}
                  style={{ ...inputStyle, fontSize: 12, padding: '6px 8px', marginBottom: 8 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--paper-dim)' }}>
                  <input type="checkbox" checked={r.is_published} onChange={() => handleTogglePublish(r)} />
                  Published
                </label>
              </div>
            ))}
          </div>
        </>
      )}
      {rows.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 20 }}>No screenshots yet.</p>}
    </div>
  )
}

// ── Inquiries tab ────────────────────────────────────────────
// Reads from promptiq_inquiries — the same table the public Contact
// page writes to (service_interest is hardcoded to 'academy' there).
// Staff can see each submission, jump straight to email/phone, and
// move it through new -> contacted -> closed.
const INQUIRY_STATUSES = ['new', 'contacted', 'closed']

const STATUS_COLORS = {
  new: '#ffb454',
  contacted: '#6fb8ff',
  closed: '#7a8a7a',
}

function InquiriesTab() {
  const [rows, setRows] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    supabase
      .from('promptiq_inquiries')
      .select('*')
      .eq('service_interest', 'academy')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setRows(data || [])
        setLoading(false)
      })
  }
  useEffect(load, [])

  const handleStatusChange = async (row, status) => {
    const { error } = await supabase.from('promptiq_inquiries').update({ status }).eq('id', row.id)
    if (error) { alert('Failed to update status: ' + error.message); return }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)))
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this inquiry?')) return
    const { error } = await supabase.from('promptiq_inquiries').delete().eq('id', id)
    if (error) { alert('Failed to delete: ' + error.message); return }
    load()
  }

  const visibleRows = statusFilter === 'all' ? rows : rows.filter((r) => r.status === statusFilter)
  const counts = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc }, {})

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 14 }}>Contact form inquiries</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, maxWidth: 560 }}>
        Submissions from the Academy contact page.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', ...INQUIRY_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid var(--panel-line)',
              background: statusFilter === s ? 'var(--violet)' : 'var(--panel)',
              color: statusFilter === s ? '#fff' : 'var(--paper-dim)',
              cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {s} {s !== 'all' && counts[s] ? `(${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</p>}
      {!loading && visibleRows.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No inquiries here.</p>}

      <div style={{ display: 'grid', gap: 10 }}>
        {visibleRows.map((r) => (
          <div key={r.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>{r.name}</strong>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase',
                    color: '#111', background: STATUS_COLORS[r.status] || '#999',
                  }}>
                    {r.status}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 8px' }}>
                  {r.inquiry_type.replace('_', ' ')} · {new Date(r.created_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p style={{ fontSize: 13, color: 'var(--paper-dim)', lineHeight: 1.5, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
                  {r.message}
                </p>
                <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                  <a href={`mailto:${r.email}`} style={{ color: 'var(--violet-soft)' }}>{r.email}</a>
                  <a href={`tel:${r.phone}`} style={{ color: 'var(--violet-soft)' }}>{r.phone}</a>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r, e.target.value)}
                  style={{ ...inputStyle, width: 'auto', fontSize: 12, padding: '6px 10px' }}
                >
                  {INQUIRY_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#ff8888', fontSize: 12, cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Reviews tab ─────────────────────────────────────────────
// Public-submitted reviews (from /reviews) mixed with reviews staff
// add on someone's behalf. Staff can always publish/unpublish any
// review, but editing or deleting only works on reviews staff
// themselves created (is_admin_authored) — the database enforces this
// too (see the migration's trigger + delete policy), this UI just
// doesn't show buttons that would fail.
const PRIVATE_MENTORSHIP = 'PRIVATE_MENTORSHIP'
const REVIEW_FILTERS = ['all', 'published', 'unpublished']

const emptyReviewDraft = {
  name: '', email: '', location: '', occupation: '', cohort: '', content: '', is_published: true,
}

function cohortLabel(t) {
  return `${t.title}${t.training_date ? ` (${t.training_date})` : ''} · ${t.status}`
}

function ReviewsTab() {
  const [rows, setRows] = useState([])
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [draft, setDraft] = useState(emptyReviewDraft)
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState(null)

  const load = () => {
    setLoading(true)
    supabase
      .from('academy_reviews')
      .select('*, academy_trainings(title)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Failed to load reviews:', error)
        setRows(data || [])
        setLoading(false)
      })
  }

  const loadTrainings = () => {
    supabase
      .from('academy_trainings')
      .select('id, title, status, training_date')
      .order('training_date', { ascending: false })
      .then(({ data, error }) => { if (error) console.error(error); setTrainings(data || []) })
  }

  useEffect(() => { load(); loadTrainings() }, [])

  const handleAddReview = async (e) => {
    e.preventDefault()
    if (!draft.cohort) { setAddError('Select a cohort or Private mentorship.'); return }
    setSaving(true)
    setAddError(null)

    const payload = {
      name: draft.name.trim(),
      email: draft.email.trim() || null,
      location: draft.location.trim() || null,
      occupation: draft.occupation.trim() || null,
      content: draft.content.trim(),
      training_id: draft.cohort === PRIVATE_MENTORSHIP ? null : draft.cohort,
      is_private_mentorship: draft.cohort === PRIVATE_MENTORSHIP,
      is_published: draft.is_published,
      is_admin_authored: true,
    }
    const { error } = await supabase.from('academy_reviews').insert([payload])
    setSaving(false)
    if (error) { setAddError('Failed to save: ' + error.message); return }
    setDraft(emptyReviewDraft)
    setShowAddForm(false)
    load()
  }

  const handleTogglePublish = async (row) => {
    const { error } = await supabase
      .from('academy_reviews')
      .update({ is_published: !row.is_published })
      .eq('id', row.id)
    if (error) { alert('Failed to update: ' + error.message); return }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_published: !r.is_published } : r)))
  }

  const handleDelete = async (row) => {
    if (!row.is_admin_authored) return // button is hidden for these rows — guard anyway
    if (!confirm('Delete this review?')) return
    const { error } = await supabase.from('academy_reviews').delete().eq('id', row.id)
    if (error) { alert('Failed to delete: ' + error.message); return }
    load()
  }

  const counts = {
    all: rows.length,
    published: rows.filter((r) => r.is_published).length,
    unpublished: rows.filter((r) => !r.is_published).length,
  }
  const visibleRows = filter === 'all' ? rows : rows.filter((r) => (filter === 'published' ? r.is_published : !r.is_published))

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, maxWidth: 560 }}>
        Reviews people submit at /reviews go live immediately — no approval step. You can unpublish
        any review here. Reviews you add yourself can also be edited or deleted; a review someone
        else submitted can only be unpublished, never edited or deleted.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {REVIEW_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid var(--panel-line)',
              background: filter === f ? 'var(--violet)' : 'var(--panel)',
              color: filter === f ? '#fff' : 'var(--paper-dim)',
              cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {f} ({f === 'all' ? counts.all : counts[f]})
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <button className="btn-outline" onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? 'Cancel' : "+ Add review on someone's behalf"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddReview} style={{ display: 'grid', gap: 12, marginBottom: 32, maxWidth: 520, ...cardStyle }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Name"><input style={inputStyle} required value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} /></Field>
            <Field label="Email (optional)"><input style={inputStyle} type="email" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Location"><input style={inputStyle} value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} /></Field>
            <Field label="Occupation"><input style={inputStyle} value={draft.occupation} onChange={(e) => setDraft((d) => ({ ...d, occupation: e.target.value }))} /></Field>
          </div>
          <Field label="Cohort / Private mentorship">
            <select style={inputStyle} value={draft.cohort} onChange={(e) => setDraft((d) => ({ ...d, cohort: e.target.value }))}>
              <option value="" disabled>Select one…</option>
              <option value={PRIVATE_MENTORSHIP}>Private mentorship</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>{cohortLabel(t)}</option>
              ))}
            </select>
          </Field>
          <Field label="Review"><textarea style={{ ...inputStyle, minHeight: 90 }} required value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} /></Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--paper-dim)' }}>
            <input type="checkbox" checked={draft.is_published} onChange={(e) => setDraft((d) => ({ ...d, is_published: e.target.checked }))} />
            Published (visible on site)
          </label>
          {addError && <p style={{ color: '#ff8888', fontSize: 13 }}>{addError}</p>}
          <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'fit-content' }}>
            {saving ? 'Saving…' : 'Save review'}
          </button>
        </form>
      )}

      {loading && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</p>}
      {!loading && visibleRows.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nothing here.</p>}

      <div style={{ display: 'grid', gap: 10 }}>
        {visibleRows.map((r) => (
          <ReviewRow key={r.id} row={r} trainings={trainings} onTogglePublish={handleTogglePublish} onDelete={handleDelete} onSaved={load} />
        ))}
      </div>
    </div>
  )
}

function ReviewRow({ row, trainings, onTogglePublish, onDelete, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: row.name, email: row.email || '', location: row.location || '', occupation: row.occupation || '',
    content: row.content, cohort: row.is_private_mentorship ? PRIVATE_MENTORSHIP : (row.training_id || ''),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      location: form.location.trim() || null,
      occupation: form.occupation.trim() || null,
      content: form.content.trim(),
      training_id: form.cohort === PRIVATE_MENTORSHIP ? null : form.cohort,
      is_private_mentorship: form.cohort === PRIVATE_MENTORSHIP,
    }
    const { error } = await supabase.from('academy_reviews').update(payload).eq('id', row.id)
    setSaving(false)
    if (error) { setError('Failed to save: ' + error.message); return }
    setEditing(false)
    onSaved()
  }

  if (editing) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Name"><input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Email"><input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Location"><input style={inputStyle} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} /></Field>
            <Field label="Occupation"><input style={inputStyle} value={form.occupation} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))} /></Field>
          </div>
          <Field label="Cohort / Private mentorship">
            <select style={inputStyle} value={form.cohort} onChange={(e) => setForm((f) => ({ ...f, cohort: e.target.value }))}>
              <option value={PRIVATE_MENTORSHIP}>Private mentorship</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>{cohortLabel(t)}</option>
              ))}
            </select>
          </Field>
          <Field label="Review"><textarea style={{ ...inputStyle, minHeight: 90 }} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} /></Field>
          {error && <p style={{ color: '#ff8888', fontSize: 13 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: 'fit-content' }}>{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setEditing(false)} style={{ background: 'none', border: '1px solid var(--panel-line)', borderRadius: 8, padding: '8px 16px', color: 'var(--paper-dim)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...cardStyle, opacity: row.is_published ? 1 : 0.55 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 14 }}>{row.name}</strong>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', color: '#111', background: row.is_published ? '#7fd88f' : '#999' }}>
              {row.is_published ? 'Published' : 'Hidden'}
            </span>
            {row.is_admin_authored && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', color: '#111', background: 'var(--violet)' }}>
                Staff-added
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 8px' }}>
            {row.is_private_mentorship ? 'Private mentorship' : (row.academy_trainings?.title || 'No cohort')}
            {(row.occupation || row.location) ? ` · ${[row.occupation, row.location].filter(Boolean).join(' · ')}` : ''}
          </p>
          <p style={{ fontSize: 13, color: 'var(--paper-dim)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {row.content}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--paper-dim)' }}>
            <input type="checkbox" checked={row.is_published} onChange={() => onTogglePublish(row)} />
            Published
          </label>
          {row.is_admin_authored && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--violet-soft)', fontSize: 12, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => onDelete(row)} style={{ background: 'none', border: 'none', color: '#ff8888', fontSize: 12, cursor: 'pointer' }}>Delete</button>
            </div>
          )}
        </div>
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
            { id: 'reviews', label: 'Reviews' },
            { id: 'screenshots', label: 'Chat Screenshots' },
            { id: 'inquiries', label: 'Inquiries' },
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
        {tab === 'screenshots' && <ScreenshotsTab />}
        {tab === 'inquiries' && <InquiriesTab />}
      </div>
    </section>
  )
}
