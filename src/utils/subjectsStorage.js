import { CATEGORIES_HUB_INITIAL } from '../data/categoriesHubData'

const STORAGE_KEY = 'sriram_subjects_v1'

export function loadSubjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* ignore */
  }
  const seeded = (CATEGORIES_HUB_INITIAL.subject || []).map((s) => ({
    ...s,
    subjectId: s.subjectId || `SUB${String(s.id).padStart(3, '0')}`,
  }))
  saveSubjects(seeded)
  return seeded
}

export function saveSubjects(subjects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects))
    window.dispatchEvent(new CustomEvent('subjects-updated', { detail: subjects }))
  } catch {
    /* ignore */
  }
}

export function formatSubjectLabel(subject) {
  if (!subject) return ''
  const id = subject.subjectId || subject.id
  return `${id} - ${subject.name}`
}

export function nextSubjectId(list) {
  const max = list.reduce((m, row) => {
    const raw = row.subjectId || row.id || ''
    const num = parseInt(String(raw).replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `SUB${String(max + 1).padStart(3, '0')}`
}
