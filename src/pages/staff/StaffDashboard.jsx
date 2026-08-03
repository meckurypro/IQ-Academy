// src/pages/staff/StaffDashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const inputStyle = {
  width: '100%', background: 'var(--panel)', border: '1px solid var(--panel-line)',
  color: 'var(--paper)', padding: '10px 12px', borderRadius: 6, fontSize: 14,
}
const labelStyle = { fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 5 }

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

// ── Trainings tab ─────────────────────────────────────────
function TrainingsTab() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ title: '', description: '', training_date: '', location: '', format: 'in_person', status: 'upcoming' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    supabase.from('academy_trainings').select('*').order('training_date', { ascending: false })
      .then(({ data, error }) => { if (error) console.error(error); setRows(data || []) })
  }
  useEffect(load, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('academy_trainings').insert([form])
    setSaving(false)
    if (error) { alert('Failed to save: ' + error.message); return }
    setForm({ title: '', description: '', training_date: '', location: '', format: 'in_person', status: 'upcoming' })
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this training?')) return
    const { error } = await supabase.from('academy_trainings').delete().eq('id', id)
    if (error) { alert('Failed to delete: ' + error.message); return }
    load()
  }

  return (
    <div>
      <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12, marginBottom: 32, maxWidth: 520 }}>
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
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add training'}</button>
      </form>

      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--panel)', border: '1px solid var(--panel-line)', borderRadius: 8 }}>
            <div>
              <strong style={{ fontSize: 14 }}>{r.title}</strong>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>{r.training_date || 'No date'} · {r.status}</p>
            </div>
            <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#ff8888', fontSize: 13, cursor: 'pointer' }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Media tab ──────────────────────────────────────────────
function MediaTab() {
  const [trainings, setTrainings] = useState([])
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ training_id: '', media_type: 'image', url: '', caption: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    supabase.from('academy_trainings').select('id, title').order('training_date', { ascending: false })
      .then(({ data }) => setTrainings(data || []))
    supabase.from('academy_media').select('*, academy_trainings(title)').order('created_at', { ascending: false })
      .then(({ data, error }) => { if (error) console.error(error); setRows(data || []) })
  }
  useEffect(load, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.training_id) { alert('Pick a training/event first.'); return }
    setSaving(true)
    const { error } = await supabase.from('academy_media').insert([form])
    setSaving(false)
    if (error) { alert('Failed to save: ' + error.message); return }
    setForm({ training_id: '', media_type: 'image', url: '', caption: '' })
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this media item?')) return
    const { error } = await supabase.from('academy_media').delete().eq('id', id)
    if (error) { alert('Failed to delete: ' + error.message); return }
    load()
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, maxWidth: 520 }}>
        Paste a direct image/video URL (e.g. from Supabase Storage, or any hosted link).
        Drag-and-drop upload can be added later once a Storage bucket is set up.
      </p>
      <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12, marginBottom: 32, maxWidth: 520 }}>
        <Field label="Event / training">
          <select style={inputStyle} value={form.training_id} onChange={(e) => setForm((p) => ({ ...p, training_id: e.target.value }))}>
            <option value="">Select…</option>
            {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Type">
            <select style={inputStyle} value={form.media_type} onChange={(e) => setForm((p) => ({ ...p, media_type: e.target.value }))}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </Field>
          <Field label="Caption (optional)"><input style={inputStyle} value={form.caption} onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))} /></Field>
        </div>
        <Field label="URL"><input style={inputStyle} required value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} /></Field>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add media'}</button>
      </form>

      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--panel)', border: '1px solid var(--panel-line)', borderRadius: 8 }}>
            <div>
              <strong style={{ fontSize: 14 }}>{r.academy_trainings?.title || 'Unlinked'}</strong>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>{r.media_type} · {r.caption || 'No caption'}</p>
            </div>
            <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#ff8888', fontSize: 13, cursor: 'pointer' }}>Delete</button>
          </div>
        ))}
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
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add testimonial'}</button>
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
  const [tab, setTab] = useState('trainings')

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
            { id: 'trainings', label: 'Trainings' },
            { id: 'media', label: 'Past Events & Media' },
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

        {tab === 'trainings' && <TrainingsTab />}
        {tab === 'media' && <MediaTab />}
        {tab === 'testimonials' && <TestimonialsTab />}
      </div>
    </section>
  )
}
