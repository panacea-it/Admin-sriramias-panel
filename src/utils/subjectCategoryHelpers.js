const LIVE_CATEGORY = 'Live Class'
const RECORDED_CATEGORY = 'Recording'
const TEST_SERIES_CATEGORY = 'Test'
const MAINS_ANSWER_WRITING_CATEGORY = 'Mains Answer Writing'
const PDF_CATEGORY = 'PDF'

const LEGACY_CATEGORY_ALIASES = {
  'Recorded Class': RECORDED_CATEGORY,
  'Test Series': TEST_SERIES_CATEGORY,
}

/** API enum values from GET /faculty-subjects → UI labels used in content explorer */
const API_CATEGORY_LABELS = {
  LIVE_CLASS: LIVE_CATEGORY,
  RECORDING: RECORDED_CATEGORY,
  RECORDED_CLASS: RECORDED_CATEGORY,
  PRELIMS_TEST: TEST_SERIES_CATEGORY,
  TEST_SERIES: TEST_SERIES_CATEGORY,
  PDF: PDF_CATEGORY,
  MAINS_ANSWER_WRITING: MAINS_ANSWER_WRITING_CATEGORY,
}

export function canonicalCategory(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  const upper = trimmed.toUpperCase()
  if (API_CATEGORY_LABELS[upper]) return API_CATEGORY_LABELS[upper]
  return LEGACY_CATEGORY_ALIASES[trimmed] || trimmed
}

export const CONTENT_CATEGORY_KEYS = {
  live: LIVE_CATEGORY,
  recording: RECORDED_CATEGORY,
  test: TEST_SERIES_CATEGORY,
  mainsAnswerWriting: MAINS_ANSWER_WRITING_CATEGORY,
  pdf: PDF_CATEGORY,
}

export function normalizeTopics(value) {
  if (Array.isArray(value)) {
    return value.map((t) => String(t).trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

export function normalizeCategories(value) {
  let list = []
  if (Array.isArray(value)) {
    list = value.map((c) => String(c).trim()).filter(Boolean)
  } else if (typeof value === 'string' && value.trim()) {
    list = [value.trim()]
  }
  return [...new Set(list.map(canonicalCategory).filter(Boolean))]
}

export function isLiveClassCategory(category) {
  return normalizeCategories(category).includes(LIVE_CATEGORY)
}

export function isRecordedClassCategory(category) {
  const cats = normalizeCategories(category)
  return cats.includes(RECORDED_CATEGORY) || cats.includes('Recorded Class')
}

export function isTestSeriesCategory(category) {
  const cats = normalizeCategories(category)
  return cats.includes(TEST_SERIES_CATEGORY) || cats.includes('Test Series')
}

export function isMainsAnswerWritingCategory(category) {
  return normalizeCategories(category).includes(MAINS_ANSWER_WRITING_CATEGORY)
}

export function isPdfCategory(category) {
  return normalizeCategories(category).includes(PDF_CATEGORY)
}

/** Content types available in Add Option, derived from subject categories. */
export function getSubjectContentTypes(categories) {
  const cats = normalizeCategories(categories)
  const types = []
  if (cats.includes(LIVE_CATEGORY)) types.push('live')
  if (cats.includes(RECORDED_CATEGORY)) types.push('recording')
  if (cats.includes(TEST_SERIES_CATEGORY)) types.push('test')
  if (cats.includes(MAINS_ANSWER_WRITING_CATEGORY)) types.push('mainsAnswerWriting')
  if (cats.includes(PDF_CATEGORY)) types.push('pdf')
  return types
}

export function contentTypeLabel(type) {
  const map = {
    live: 'Live Class',
    recording: 'Recording',
    test: 'Prelims Test',
    mainsAnswerWriting: 'Mains Answer Writing',
    pdf: 'PDF',
  }
  return map[type] || type
}

export function shouldShowTestSeriesSection(
  values,
  { liveClassOnly = false, subjectOnly = false, contentType } = {},
) {
  if (subjectOnly || liveClassOnly) return false
  if (contentType) return contentType === 'test'
  return isTestSeriesCategory(values.categories ?? values.category)
}

export function deriveClassTypeLabel(categories) {
  const cats = normalizeCategories(categories)
  const parts = []
  if (cats.includes(LIVE_CATEGORY)) parts.push('Live')
  if (isRecordedClassCategory(cats)) parts.push('Recording')
  if (isTestSeriesCategory(cats)) parts.push('Prelims Test')
  if (cats.includes(MAINS_ANSWER_WRITING_CATEGORY)) parts.push('Mains Answer Writing')
  if (cats.includes(PDF_CATEGORY)) parts.push('PDF')
  if (parts.length) return parts.join(' + ')
  return cats.length ? cats.join(', ') : '—'
}

export function deriveTestSeriesStatus(subject) {
  if (!isTestSeriesCategory(subject?.categories ?? subject?.category)) return '—'
  const ts = subject?.testSeries
  if (!ts) return 'Not configured'
  const questions = ts.questions?.length ?? 0
  if (!questions) return 'Draft'
  const schedule = ts.schedule?.date || ts.scheduleDate
  if (schedule) return 'Scheduled'
  return 'Ready'
}

export function deriveLiveStatus(subject) {
  const live = subject?.liveClasses || []
  if (!live.length) return 'None'
  const active = live.some((lc) => lc.status !== 'In Active' && lc.status !== 'Disabled')
  return active ? 'Scheduled' : 'Deactivated'
}

export function deriveRecordingStatus(subject) {
  const rec = subject?.recordings || []
  if (!rec.length) return 'None'
  const published = rec.some((r) => r.status === 'Published' || r.status === 'Active')
  return published ? 'Published' : 'Draft'
}

export function derivePdfStatus(subject) {
  if (!isPdfCategory(subject?.categories ?? subject?.category)) return '—'
  const pdfs = subject?.pdfs || []
  if (!pdfs.length) return 'None'
  const published = pdfs.some((p) => p.visibility === 'Published' || p.status === 'Active')
  return published ? 'Published' : 'Draft'
}
