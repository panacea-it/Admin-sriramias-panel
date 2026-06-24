import { mapInitialBatchesToRows } from './batchHelpers'

const STORAGE_KEY = 'sriram_batches_api_v1'

export function loadBatchesStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* ignore */
  }
  const seed = mapInitialBatchesToRows()
  saveBatchesStore(seed)
  return seed
}

export function saveBatchesStore(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  window.dispatchEvent(new CustomEvent('batches-api-updated', { detail: rows }))
}

export function findBatchById(id) {
  return loadBatchesStore().find((r) => String(r.id) === String(id)) || null
}
