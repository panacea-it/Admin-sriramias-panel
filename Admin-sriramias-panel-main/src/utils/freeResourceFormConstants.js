export const FREE_RESOURCE_DRAFT_KEY = 'free-resource-form-draft'

/** Canonical labels from Figma — only these four appear in the category dropdown */
export const FREE_RESOURCE_CATEGORY = {
  NCERT: 'NCERT Books',
  PREVIOUS_YEAR: 'Previous Year Question papers',
  MOCK_TEST: 'Free Mock Tests',
  STUDY_MATERIAL: 'Study Material',
}

export const FREE_RESOURCE_CATEGORY_LIST = Object.values(FREE_RESOURCE_CATEGORY)

const LEGACY_CATEGORY_ALIASES = {
  'Previous Year Question Papers': FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR,
  'Free Mock Test': FREE_RESOURCE_CATEGORY.MOCK_TEST,
}

export function normalizeFreeResourceCategory(category) {
  const value = String(category || '').trim()
  return LEGACY_CATEGORY_ALIASES[value] || value
}

export function isAllowedFreeResourceCategory(category) {
  return FREE_RESOURCE_CATEGORY_LIST.includes(normalizeFreeResourceCategory(category))
}

export const EXAM_CATEGORY_OPTIONS = [
  'UPSC',
  'APPSC',
  'TSPSC',
  'SSC',
  'Banking',
  'Railway',
  'State PSC',
]

/** Prelims / Mains / Interview — used for Paper Type and Mains Category dropdowns */
export const MAINS_CATEGORY_OPTIONS = ['Prelims', 'Mains', 'Interview']

export const PAPER_TYPE_OPTIONS = MAINS_CATEGORY_OPTIONS

export const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const CURRENT_YEAR = new Date().getFullYear()
export const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(CURRENT_YEAR - i))

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']
export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 6
export const MAX_FREE_RESOURCE_QUESTIONS = 500
export const QUESTION_LIST_CHUNK = 20

export const BULK_QUESTION_ACCEPT = '.csv,.xlsx,.xls,.json,text/csv,application/json'

export function isQuestionCategory(category) {
  return normalizeFreeResourceCategory(category) === FREE_RESOURCE_CATEGORY.MOCK_TEST
}
