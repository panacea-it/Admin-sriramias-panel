import { CATEGORIES_HUB_INITIAL } from '../data/categoriesHubData'

const STORAGE_KEY = 'sriram_teachers_v1'

export function loadTeachers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  const seeded = CATEGORIES_HUB_INITIAL.teachers || []
  saveTeachers(seeded)
  return seeded
}

export function saveTeachers(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent('teachers-updated', { detail: items }))
  } catch {
    /* ignore */
  }
}
