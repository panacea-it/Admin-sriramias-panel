import {
  FREE_RESOURCE_CATEGORIES,
  INITIAL_FREE_RESOURCES,
} from '../data/freeResourcesData'

const RESOURCES_KEY = 'sriram_free_resources_v1'
const CATEGORIES_KEY = 'sriram_free_resource_categories_v1'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : fallback
  } catch {
    return fallback
  }
}

export function loadFreeResources() {
  return readJson(RESOURCES_KEY, INITIAL_FREE_RESOURCES)
}

export function saveFreeResources(resources) {
  try {
    localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources))
  } catch {
    /* ignore */
  }
}

export function loadFreeResourceCategories() {
  return readJson(CATEGORIES_KEY, FREE_RESOURCE_CATEGORIES)
}

export function saveFreeResourceCategories(categories) {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  } catch {
    /* ignore */
  }
}
