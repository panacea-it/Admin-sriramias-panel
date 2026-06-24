export const PYQ_PAPER_PRELIMS_OPTIONS = ['General Studies', 'CSAT']

export const PYQ_PAPER_MAINS_OPTIONS = ['GS I', 'GS II', 'GS III', 'GS IV']

export function normalizePaperTypeValue(paperType) {
  const raw = String(paperType || '').trim()
  if (!raw) return ''

  const upper = raw.toUpperCase().replace(/[\s-]+/g, '_')
  if (upper === 'PRELIMS' || upper === 'PRELIM') return 'PRELIMS'
  if (upper === 'MAINS' || upper === 'MAIN') return 'MAINS'
  if (upper === 'INTERVIEW') return 'INTERVIEW'
  return upper
}

export function isInterviewPaperType(paperType) {
  return normalizePaperTypeValue(paperType) === 'INTERVIEW'
}

export function isPyqPaperFieldVisible(paperType) {
  const normalized = normalizePaperTypeValue(paperType)
  return normalized === 'PRELIMS' || normalized === 'MAINS'
}

export function isPyqPaperFieldRequired(paperType) {
  return isPyqPaperFieldVisible(paperType)
}

export function getPyqPaperOptions(paperType) {
  const normalized = normalizePaperTypeValue(paperType)
  if (normalized === 'PRELIMS') {
    return PYQ_PAPER_PRELIMS_OPTIONS.map((value) => ({ value, label: value }))
  }
  if (normalized === 'MAINS') {
    return PYQ_PAPER_MAINS_OPTIONS.map((value) => ({ value, label: value }))
  }
  return []
}

export function resolvePyqPaperOptions(paperType, currentPaper = '') {
  const options = getPyqPaperOptions(paperType)
  const selected = String(currentPaper || '').trim()
  if (selected && !options.some((option) => option.value === selected)) {
    return [{ value: selected, label: selected }, ...options]
  }
  return options
}
