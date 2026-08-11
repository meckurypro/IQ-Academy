// src/components/Logo.jsx
const LOGO_URL = '/academyfav.png'

export default function Logo({ className = '' }) {
  return <img src={LOGO_URL} alt="IQ Academy" className={`logo-mark ${className}`.trim()} />
}

export { LOGO_URL }
