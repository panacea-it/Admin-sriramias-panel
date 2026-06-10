import { ACADEMICS_SUBJECTS_SEED } from '../data/academicsSubjectsSeed'
import { canonicalCategory, normalizeCategories } from './subjectCategoryHelpers'

const STORAGE_KEY = 'academics_subjects_module_v1'
const LEGACY_KEYS = [
  'academics_subjects_module',
  'academics_subjects_v1',
  'academics_subjects',
  'sriram_subjects_v1',
]

function migrateSubjectRow(row) {
  const topics = row.topics?.length
    ? row.topics
    : row.topic
      ? [row.topic]
      : []
  const rawCategories = row.categories?.length
    ? row.categories
    : row.category
      ? [row.category]
      : []
  const categories = normalizeCategories(rawCategories)
  return {
    ...row,
    topics,
    topic: topics[0] || row.topic || '',
    categories,
    category: canonicalCategory(categories[0] || row.category || ''),
    recordings: row.recordings || [],
    pdfs: row.pdfs || [],
    liveClasses: row.liveClasses || [],
    enableTestSeries: Boolean(row.enableTestSeries),
    testSeries: row.testSeries ?? null,
  }
}

export function loadAcademicsSubjects() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      for (const key of LEGACY_KEYS) {
        const legacy = localStorage.getItem(key)
        if (legacy) {
          raw = legacy
          try {
            localStorage.setItem(STORAGE_KEY, legacy)
          } catch {
            /* ignore */
          }
          break
        }
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(migrateSubjectRow)
    }
  } catch {
    /* ignore */
  }
  saveAcademicsSubjects(ACADEMICS_SUBJECTS_SEED)
  return ACADEMICS_SUBJECTS_SEED.map(migrateSubjectRow)
}

export function saveAcademicsSubjects(subjects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects))
    window.dispatchEvent(
      new CustomEvent('academics-subjects-updated', { detail: subjects }),
    )
  } catch {
    /* ignore */
  }
}

export function nextSubjectRowId(list) {
  const max = list.reduce((m, row) => {
    const num = parseInt(String(row.id || '').replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return String(max + 1).padStart(3, '0')
}

export function nextLiveClassId(liveClasses = []) {
  const max = liveClasses.reduce((m, row) => {
    const num = parseInt(String(row.id || '').replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return String(max + 1).padStart(3, '0')
}

export function nextRecordingId(recordings = []) {
  const max = recordings.reduce((m, row) => {
    const num = parseInt(String(row.id || '').replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return String(max + 1).padStart(3, '0')
}

export function nextPdfId(pdfs = []) {
  const max = pdfs.reduce((m, row) => {
    const num = parseInt(String(row.id || '').replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return String(max + 1).padStart(3, '0')
}

export function formatSubjectViewTitle(subject) {
  if (!subject) return 'Subject'
  const name = subject.subjectName || subject.subject || 'Subject'
  const topics = subject.topics?.length
    ? subject.topics
    : subject.topic
      ? [subject.topic]
      : []
  const topic = topics.length ? ` ( ${topics.join(', ')} )` : ''
  const teacherLabel = subject.teacher?.includes('Darshan')
    ? 'Darshan Sir'
    : subject.teacher
  return teacherLabel ? `${name}${topic} By ${teacherLabel}` : `${name}${topic}`
}

export function padTimePart(value) {
  const n = Math.min(59, Math.max(0, parseInt(String(value || '0'), 10) || 0))
  return String(n).padStart(2, '0')
}

export function formatTimeTriple(hrs, min, sec) {
  return `${padTimePart(hrs)} : ${padTimePart(min)} : ${padTimePart(sec)}`
}

export function formatDurationFromForm(hrs, min, sec) {
  const h = parseInt(padTimePart(hrs), 10)
  const m = parseInt(padTimePart(min), 10)
  if (h === 0 && m === 0) return '—'
  const endH = h + Math.floor((m + parseInt(padTimePart(sec), 10) / 60) / 60)
  const startLabel = h <= 12 ? `${h || 12} AM` : `${h - 12} PM`
  const endLabel = endH <= 12 ? `${endH || 12} AM` : `${endH - 12} PM`
  return `${startLabel} to ${endLabel}`
}

export function parseDateForDisplay(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
