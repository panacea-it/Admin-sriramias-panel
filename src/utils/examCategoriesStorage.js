import { CATEGORIES_HUB_INITIAL } from '../data/categoriesHubData'

const STORAGE_KEY = 'sriram_exam_categories_v1'

export function loadExamCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* ignore */
  }
  const seeded = CATEGORIES_HUB_INITIAL['exam-category'] || []
  saveExamCategories(seeded)
  return seeded
}

export function saveExamCategories(categories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
    window.dispatchEvent(new CustomEvent('exam-categories-updated', { detail: categories }))
  } catch {
    /* ignore */
  }
}

export function formatExamCategoryLabel(category) {
  if (!category) return ''
  const id = category.categoryId || category.id
  return `${id} - ${category.name}`
}

/** Exam categories assigned to a program */
export function getExamCategoriesForProgram(categories, programId) {
  if (!programId) return []
  const key = String(programId)
  return categories.filter((c) => String(c.programId) === key)
}

/** Exam categories for a program at a specific centre */
export function getExamCategoriesForCentreAndProgram(categories, centerId, programId) {
  const forProgram = getExamCategoriesForProgram(categories, programId)
  if (!centerId) return forProgram
  const key = String(centerId)
  return forProgram.filter((c) => !c.centerId || String(c.centerId) === key)
}
