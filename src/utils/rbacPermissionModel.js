/** Granular permission actions per feature (UI + storage). */
export const PERMISSION_ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Deactivate' },
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

/** Flatten nested feature definitions to leaf nodes. */
export function flattenFeatureDefinitions(definitions) {
  const leaves = []

  function walk(items) {
    for (const item of Array.isArray(items) ? items : []) {
      if (item.children?.length) {
        walk(item.children)
      } else if (item?.id) {
        leaves.push(item)
      }
    }
  }

  walk(definitions)
  return leaves
}

/** Collect leaf ids from a group node's children. */
export function collectLeafIds(nodes) {
  return flattenFeatureDefinitions(nodes).map((n) => n.id)
}

/** @param {Record<string, boolean|Record<string, boolean>>} featureMap */
export function summarizeFeatureMap(featureMap, definitions = null) {
  const leaves = definitions ? flattenFeatureDefinitions(definitions) : null

  if (leaves?.length) {
    let allowed = 0
    for (const leaf of leaves) {
      if (isFeaturePermissionActive(featureMap?.[leaf.id])) allowed += 1
    }
    const total = leaves.length
    return { allowed, restricted: total - allowed, total }
  }

  const entries = Object.values(featureMap || {})
  let allowed = 0
  for (const val of entries) {
    if (isFeaturePermissionActive(val)) allowed += 1
  }
  const total = entries.length
  return { allowed, restricted: total - allowed, total }
}

/** Merge saved feature permissions with defaults (handles booleans and permission sets). */
export function mergeSavedFeatureValue(defaultVal, savedVal) {
  if (typeof savedVal === 'boolean') {
    return savedVal ? fullPermissionSet() : emptyPermissionSet()
  }
  if (savedVal && typeof savedVal === 'object') {
    return normalizeFeaturePermissions(savedVal)
  }
  return normalizeFeaturePermissions(defaultVal)
}
