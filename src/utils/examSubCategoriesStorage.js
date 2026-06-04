import { CATEGORIES_HUB_INITIAL } from '../data/categoriesHubData'

const STORAGE_KEY = 'sriram_exam_subcategories_v1'

export function loadExamSubCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* ignore */
  }
  const seeded = CATEGORIES_HUB_INITIAL['exam-sub-category'] || []
  saveExamSubCategories(seeded)
  return seeded
}

export function saveExamSubCategories(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent('exam-subcategories-updated', { detail: items }))
  } catch {
    /* ignore */
  }
}

export function formatExamSubCategoryLabel(item) {
  if (!item) return ''
  const id = item.subcategoryId || item.id
  return `${id} - ${item.name}`
}

/** Sub-categories under an exam category */
export function getExamSubCategoriesForCategory(items, examCategoryId) {
  if (!examCategoryId) return []
  const key = String(examCategoryId)
  return items.filter((s) => String(s.examCategoryId) === key)
}

/** Sub-categories for a category at a specific centre */
export function getExamSubCategoriesForCentreAndCategory(items, centerId, examCategoryId) {
  const forCategory = getExamSubCategoriesForCategory(items, examCategoryId)
  if (!centerId) return forCategory
  const key = String(centerId)
  return forCategory.filter((s) => !s.centerId || String(s.centerId) === key)
}
