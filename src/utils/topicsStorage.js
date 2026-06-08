import { CATEGORIES_HUB_INITIAL } from '../data/categoriesHubData'

const STORAGE_KEY = 'sriram_topics_v1'

export function loadTopics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  const seeded = CATEGORIES_HUB_INITIAL.topic || []
  saveTopics(seeded)
  return seeded
}

export function saveTopics(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent('topics-updated', { detail: items }))
  } catch {
    /* ignore */
  }
}
