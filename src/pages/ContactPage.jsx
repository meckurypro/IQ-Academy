// src/pages/ContactPage.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const INQUIRY_TYPES = [
  { value: 'general', label: 'General enquiry' },
  { value: 'consultation', label: 'Book a consultation' },
  { value: 'custom_job', label: 'Custom training request' },
  { value: 'content_request', label: 'Content request' },
]

const inputStyle = {
  width: '100%', background: 'var(--panel)', border: '1px solid var(--panel-line)',
  color: 'var(--paper)', padding: '12px 14px', borderRadius: 8, fontSize: 14,
  fontFamily: 'inherit',
}

const labelStyle = { fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    inquiry_type: 'general',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: insertError } = await supabase.from('promptiq_inquiries').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      inquiry_type: form.inquiry_type,
      service_interest: 'academy',
      message: form.message.trim(),
      source: 'academy.promptiq.com.ng',
    })

    setSubmitting(false)

    if (insertError) {
      setError('Something went wrong sending your message. Please try again.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <section style={{ paddingTop: 60, minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: 480, textAlign: 'center' }}>
          <span className="eyebrow">Message sent</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '14px 0 12px' }}>
            Thanks, {form.name.split(' ')[0] || 'there'}.
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.65 }}>
            We've received your message and someone from the team will get back to you shortly.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section style={{ paddingTop: 60 }}>
      <div className="container" style={{ maxWidth: 560 }}>
        <span className="eyebrow">Get in touch</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '14px 0 12px' }}>
          Contact Us
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.65, marginBottom: 30, maxWidth: 480 }}>
          Have a question about a program, want to book a consultation, or need a custom
          training for your team? Send us a message and we'll respond as soon as we can.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input type="text" required value={form.name} onChange={update('name')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone number</label>
              <input type="tel" required value={form.phone} onChange={update('phone')} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" required value={form.email} onChange={update('email')} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>What's this about?</label>
            <select value={form.inquiry_type} onChange={update('inquiry_type')} style={inputStyle}>
              {INQUIRY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Message</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={update('message')}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {error && <p style={{ color: '#ff8888', fontSize: 13 }}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 6, justifySelf: 'start' }}>
            {submitting ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </section>
  )
}
