const NAME_PATTERN = /^[\w\s\-().,/]+$/i

export function validateRequired(value, fieldLabel) {
  if (!String(value ?? '').trim()) return `${fieldLabel} is required`
  return null
}

export function validateName(value, fieldLabel) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return `${fieldLabel} is required`
  if (trimmed.length < 2) return `${fieldLabel} must be at least 2 characters`
  if (!NAME_PATTERN.test(trimmed)) return `${fieldLabel} contains invalid characters`
  return null
}

export function validateDuplicateName(name, existingRows, fieldKey, currentId) {
  const normalized = String(name ?? '').trim().toLowerCase()
  const duplicate = (existingRows || []).some(
    (row) =>
      String(row[fieldKey] ?? '')
        .trim()
        .toLowerCase() === normalized && String(row.id) !== String(currentId ?? ''),
  )
  return duplicate ? 'A record with this name already exists' : null
}

export function validatePositiveNumber(value, fieldLabel, { allowZero = false } = {}) {
  const num = Number(value)
  if (Number.isNaN(num)) return `${fieldLabel} must be a valid number`
  if (!allowZero && num <= 0) return `${fieldLabel} must be greater than 0`
  if (allowZero && num < 0) return `${fieldLabel} cannot be negative`
  return null
}

export function validateNonNegativeNumber(value, fieldLabel) {
  const num = Number(value)
  if (Number.isNaN(num) || num < 0) return `${fieldLabel} must be 0 or greater`
  return null
}

export function validateLanguageCode(code) {
  const trimmed = String(code ?? '').trim()
  if (!trimmed) return 'Language code is required'
  if (!/^[a-z]{2}(-[a-z]{2})?$/i.test(trimmed)) return 'Language code must be 2 letters (e.g. en, hi)'
  return null
}

export function computeSectionTotals(sections = []) {
  const totalQuestions = sections.reduce((sum, s) => sum + (Number(s.numberOfQuestions) || 0), 0)
  const totalMarks = sections.reduce(
    (sum, s) => sum + (Number(s.numberOfQuestions) || 0) * (Number(s.marksPerQuestion) || 0),
    0,
  )
  return { totalQuestions, totalMarks }
}

export function createEmptySection(index = 0) {
  return {
    sectionName: `Section ${index + 1}`,
    subject: '',
    topic: '',
    numberOfQuestions: 10,
    marksPerQuestion: 2,
    negativeMarks: 0.66,
    duration: 20,
    difficultyLevel: 'Medium',
  }
}

export function validateInstructionDescription(value, maxLength = 2000) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return 'Instruction description is required'
  if (!/\S/.test(trimmed)) return 'Instruction description cannot be empty spaces only'
  if (trimmed.length > maxLength) return `Instruction description must be ${maxLength} characters or fewer`
  return null
}

export function stripHtml(html) {
  if (typeof document === 'undefined') {
    return String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const div = document.createElement('div')
  div.innerHTML = html || ''
  return div.textContent?.trim() || ''
}
