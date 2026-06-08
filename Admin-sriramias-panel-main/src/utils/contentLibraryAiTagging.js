import { INITIAL_CONTENT_SUBJECTS, INITIAL_CONTENT_TOPICS } from '../data/contentLibrarySeed'

const TAG_PATTERNS = [
  { re: /polity|constitution|rights/i, tags: ['polity', 'constitution'], subjectId: 'sub-1' },
  { re: /economy|budget|fiscal/i, tags: ['economy', 'budget'], subjectId: 'sub-2' },
  { re: /history|ancient|medieval/i, tags: ['history'], subjectId: 'sub-3' },
  { re: /geography|climate|map/i, tags: ['geography'], subjectId: 'sub-4' },
  { re: /assignment|homework/i, tags: ['assignment'] },
  { re: /mock|test|practice/i, tags: ['practice', 'mock-test'] },
  { re: /recording|live|session/i, tags: ['recording', 'live-class'] },
]

export function suggestTagsFromFilename(filename = '') {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const suggestions = new Set()
  TAG_PATTERNS.forEach(({ re, tags }) => {
    if (re.test(filename) || re.test(base)) tags.forEach((t) => suggestions.add(t))
  })
  base
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4)
    .forEach((w) => suggestions.add(w.toLowerCase()))
  return [...suggestions]
}

export function suggestAcademicMapping(filename = '', title = '') {
  const text = `${filename} ${title}`
  for (const { re, subjectId, tags } of TAG_PATTERNS) {
    if (!re.test(text) || !subjectId) continue
    const topic = INITIAL_CONTENT_TOPICS.find((t) => t.subjectId === subjectId)
    const subject = INITIAL_CONTENT_SUBJECTS.find((s) => s.id === subjectId)
    return {
      subjectIds: subjectId ? [subjectId] : [],
      topicIds: topic ? [topic.id] : [],
      tags: tags || [],
      subjectName: subject?.name,
      topicName: topic?.name,
      confidence: 0.82,
    }
  }
  return { subjectIds: [], topicIds: [], tags: [], confidence: 0 }
}

export function generateSeoSlug(title = '') {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}
