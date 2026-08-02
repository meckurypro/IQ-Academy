// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>
          IQ Academy — part of <a href="https://promptiq.ng" style={{ color: 'var(--violet-soft)' }}>PromptIQ</a>. © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  )
}

