export const BATCHES_BASE = '/academics/batch'

/** Stable URL segment for batch detail routes (prefers human-readable batchId). */
export function resolveBatchRouteId(batchOrId) {
  if (batchOrId == null) return ''
  if (typeof batchOrId === 'object') {
    return String(batchOrId.batchId || batchOrId.id || '')
  }
  return String(batchOrId)
}

export function batchDetailsPath(batchOrId) {
  const id = resolveBatchRouteId(batchOrId)
  return `${BATCHES_BASE}/${encodeURIComponent(id)}`
}
