/** Stored UI values — keep for API mapping compatibility. */
export const RECORD_STATUS_ACTIVE = 'Active'
export const RECORD_STATUS_INACTIVE = 'In Active'

/** Standard display labels shown in the UI. */
export const RECORD_STATUS_LABEL_ACTIVE = 'Active'
export const RECORD_STATUS_LABEL_DEACTIVATED = 'Deactivated'

export function isRecordStatusActive(status) {
  const raw = String(status || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
  if (raw === 'IN_ACTIVE' || raw === 'INACTIVE' || raw === 'DISABLED' || raw === 'DEACTIVATED') {
    return false
  }
  return raw === 'ACTIVE' || status === RECORD_STATUS_ACTIVE
}

/** Normalize any stored/API status to standard display label. */
export function displayRecordStatusLabel(status) {
  if (status == null || status === '' || status === 'all' || status === 'Status') {
    return status ?? ''
  }
  return isRecordStatusActive(status)
    ? RECORD_STATUS_LABEL_ACTIVE
    : RECORD_STATUS_LABEL_DEACTIVATED
}

export function recordStatusActionLabel(status) {
  return isRecordStatusActive(status) ? 'Deactivate' : 'Activate'
}

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: RECORD_STATUS_ACTIVE, label: RECORD_STATUS_LABEL_ACTIVE },
  { value: RECORD_STATUS_INACTIVE, label: RECORD_STATUS_LABEL_DEACTIVATED },
]
