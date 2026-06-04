const STORAGE_KEY = 'sriram_batch_audit_v1'

export const BATCH_AUDIT_TYPES = {
  CREATED: 'Batch Created',
  DUPLICATED: 'Batch Duplicated',
  STATUS_CHANGED: 'Batch Status Changed',
  STUDENT_MOVED: 'Student Moved',
  MERGED: 'Batch Merged',
  ARCHIVED: 'Batch Archived',
  DELETED: 'Batch Deleted',
}

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAll(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore quota */
  }
}

export function getBatchAuditEntries(batchId) {
  if (!batchId) return []
  const map = loadAll()
  return (map[String(batchId)] || []).slice().sort((a, b) => b.timestamp - a.timestamp)
}

export function appendBatchAuditEntry(batchId, entry) {
  if (!batchId) return
  const map = loadAll()
  const key = String(batchId)
  const list = map[key] || []
  const next = [
    {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      ...entry,
    },
    ...list,
  ].slice(0, 100)
  map[key] = next
  saveAll(map)
}

export function appendGlobalBatchAudit(entry) {
  appendBatchAuditEntry('__global__', entry)
}
