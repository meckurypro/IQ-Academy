// src/lib/classes.js
// Single source for everything the site says about IQ Academy's physical classes.
// The enrolment app lives on its own subdomain; every "find a class" button points there.
export const CLASSES_URL = 'https://classes.promptiq.com.ng'

export const COURSES = [
  { code: 'AIF', title: 'AI Foundations', blurb: 'What AI is, how it works, and where it fits.', start: true },
  { code: 'ACC', title: 'AI Content Creation', blurb: 'Combine creativity, strategy and AI tools to create, not just generate.' },
  { code: 'CIN', title: 'Cinematic Filmmaking', blurb: 'Story, shots, consistency and production workflows for AI-assisted film.' },
  { code: 'WFA', title: 'Workflow Automation', blurb: 'See processes as systems and automate the repetitive parts.' },
  { code: 'PDX', title: 'Product Design & UI/UX', blurb: 'Understand a problem and design the solution, with AI in the process.' },
  { code: 'WEB', title: 'AI-Powered Web Development', blurb: 'Turn ideas and designs into deployed web applications.' },
  { code: 'MOB', title: 'AI-Powered Mobile App Development', blurb: 'Turn ideas and designs into working mobile apps.' },
  { code: 'ASI', title: 'AI Solutions & Integration', blurb: 'Make an application intelligent with APIs, providers and structured outputs.' },
  { code: 'AGT', title: 'AI Agents & Automation', blurb: 'Agents, RAG, tool calling, and deploying agents for real work.' },
  { code: 'ARC', title: 'AI Architecture Essentials', blurb: 'Reason about and assemble AI systems: models, infrastructure, pipelines.' },
]

export const PACKS = [
  { name: 'Standard', price: '₦50,000', courses: 2, weeks: 6, note: 'Two connected courses along the path you choose.' },
  { name: 'Intensive', price: '₦70,000', courses: 3, weeks: 10, note: 'One more course and four more weeks to build.' },
]

export const PATHWAYS = [
  { name: 'Build products', steps: ['AI Foundations', 'Product Design', 'Web or Mobile', 'AI Solutions'] },
  { name: 'Automate work', steps: ['AI Foundations', 'Workflow Automation', 'AI Agents'] },
  { name: 'Create media', steps: ['AI Foundations', 'AI Content Creation', 'Cinematic Filmmaking'] },
  { name: 'Go deep on AI systems', steps: ['AI Foundations', 'AI Solutions', 'AI Agents', 'AI Architecture'] },
]

export const STEPS = [
  { title: 'Pick your courses', body: 'Choose a Standard or Intensive pack and the courses you want. AI Foundations comes first.' },
  { title: 'Choose a centre', body: 'Find a centre near you, with the date your first course starts.' },
  { title: 'Show up and build', body: 'Three hands-on sessions a week. You finish with something you made.' },
]

export const FACTS = [
  { big: '3', label: 'sessions a week' },
  { big: '2–3 hrs', label: 'per session' },
  { big: String(COURSES.length), label: 'courses to choose from' },
]
