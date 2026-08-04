// src/components/Logo.jsx
const LOGO_URL = 'https://raw.githubusercontent.com/meckurypro/PromptIQ-/main/public/iqacademy.png'

export default function Logo({ className = '' }) {
  return <img src={LOGO_URL} alt="IQ Academy" className={`logo-mark ${className}`.trim()} />
}

export { LOGO_URL }
