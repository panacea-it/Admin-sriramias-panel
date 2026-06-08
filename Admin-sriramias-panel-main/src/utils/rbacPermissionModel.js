/** Granular permission actions per feature (UI + storage). */
export const PERMISSION_ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'export', label: 'Export' },
  { key: 'disable', label: 'Disable' },
]

export function emptyPermissionSet() {
  return Object.fromEntries(PERMISSION_ACTIONS.map((a) => [a.key, false]))
}

export function fullPermissionSet() {
  return Object.fromEntries(PERMISSION_ACTIONS.map((a) => [a.key, true]))
}

/** @param {boolean|Record<string, boolean>|null|undefined} value */
export function normalizeFeaturePermissions(value) {
  if (typeof value === 'boolean') {
    return value ? fullPermissionSet() : emptyPermissionSet()
  }
  if (!value || typeof value !== 'object') return emptyPermissionSet()
  const base = emptyPermissionSet()
  for (const { key } of PERMISSION_ACTIONS) {
    if (typeof value[key] === 'boolean') base[key] = value[key]
  }
  return base
}

/** @param {boolean|Record<string, boolean>|null|undefined} value */
export function isFeaturePermissionActive(value) {
  const norm = normalizeFeaturePermissions(value)
  return PERMISSION_ACTIONS.some((a) => norm[a.key])
}

/** @param {Record<string, boolean|Record<string, boolean>>} featureMap */
export function summarizeFeatureMap(featureMap) {
  const entries = Object.values(featureMap || {})
  let allowed = 0
  for (const val of entries) {
    if (isFeaturePermissionActive(val)) allowed += 1
  }
  const total = entries.length
  return { allowed, restricted: total - allowed, total }
}
