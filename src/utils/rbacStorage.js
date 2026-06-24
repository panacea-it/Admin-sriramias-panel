import { PERMISSION_MODULES } from '../data/adminManagementConfig'
import { RBAC_MODULE_FEATURES } from '../data/rbacConfig'
import {
  emptyPermissionSet,
  flattenFeatureDefinitions,
  mergeSavedFeatureValue,
} from './rbacPermissionModel'
import {
  buildEmptyFeatureMap,
  buildFullFeatureMap,
  cloneNestedRbac,
  getDefaultNestedRbacForRoles,
} from './rbacHelpers'

const STORAGE_KEY = 'sriram_admin_rbac_nested_v3'

export const NESTED_RBAC_CHANGED_EVENT = 'admin:nested-rbac-changed'

function dispatchRbacChanged() {
  try {
    window.dispatchEvent(new CustomEvent(NESTED_RBAC_CHANGED_EVENT))
  } catch {
    /* ignore SSR */
  }
}

function mergeModuleFeatureMap(defMap, savMap) {
  const merged = { ...defMap }
  for (const key of Object.keys(defMap)) {
    if (Object.prototype.hasOwnProperty.call(savMap, key)) {
      merged[key] = mergeSavedFeatureValue(defMap[key], savMap[key])
    }
  }
  return merged
}

/**
 * Deep-merge saved RBAC with defaults derived from current role templates.
 * @param {unknown} savedRaw
 * @param {Array<{ id: string, fullAccess?: boolean, legacyModuleMatrix?: object }>} roles
 */
export function mergeRbacWithDefaults(savedRaw, roles) {
  const defaults = cloneNestedRbac(getDefaultNestedRbacForRoles(roles))
  if (!savedRaw || typeof savedRaw !== 'object') return defaults

  const out = cloneNestedRbac(defaults)

  for (const role of roles) {
    if (role.fullAccess) continue
    const roleId = role.id
    const savedRole = savedRaw[roleId]
    if (!savedRole || typeof savedRole !== 'object') continue

    for (const mod of PERMISSION_MODULES) {
      const moduleId = mod.id
      const defMap = out[roleId]?.[moduleId]
      const savMap = savedRole[moduleId]
      if (!defMap || !savMap || typeof savMap !== 'object') continue

      out[roleId][moduleId] = mergeModuleFeatureMap(defMap, savMap)
    }
  }

  return out
}

export function loadStoredRbac() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** @param {object} nestedState */
export function persistRbacState(nestedState, { notify = false } = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nestedState))
    if (notify) dispatchRbacChanged()
  } catch (e) {
    console.error('RBAC persist failed', e)
    throw e
  }
}

/** Sync one module baseline for a role (Access Types UI + matrix storage). */
export function patchRoleModuleBaseline(roleId, moduleId, on, roles) {
  const merged = mergeRbacWithDefaults(loadStoredRbac(), roles)
  const nextMap = on ? buildFullFeatureMap(moduleId) : buildEmptyFeatureMap(moduleId)
  const roleMods = { ...(merged[roleId] || {}) }
  roleMods[moduleId] = nextMap
  persistRbacState({ ...merged, [roleId]: roleMods }, { notify: true })
}

export function clearStoredRbac() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  dispatchRbacChanged()
}

export function pruneRoleFromStoredRbac(roleId) {
  const saved = loadStoredRbac()
  if (!saved || typeof saved !== 'object') return
  const next = { ...saved }
  delete next[roleId]
  persistRbacState(next, { notify: true })
}

export function readMergedRbac(roles) {
  return mergeRbacWithDefaults(loadStoredRbac(), roles)
}

export function getInitialRbacState(roles) {
  const saved = loadStoredRbac()
  return mergeRbacWithDefaults(saved, roles)
}

export function syncNestedKeysForRoles(prevNested, roles) {
  const defaults = getDefaultNestedRbacForRoles(roles)
  const next = {}
  const validIds = new Set(roles.filter((r) => !r.fullAccess).map((r) => r.id))

  for (const role of roles) {
    if (role.fullAccess) continue
    const id = role.id
    if (!validIds.has(id)) continue

    next[id] = {}
    const prevRole = prevNested[id]
    const defRole = defaults[id]

    for (const mod of PERMISSION_MODULES) {
      const moduleId = mod.id
      const defMap = defRole?.[moduleId]
      const prevMap = prevRole?.[moduleId]

      if (defMap && prevMap && typeof prevMap === 'object') {
        next[id][moduleId] = mergeModuleFeatureMap(defMap, prevMap)
      } else {
        next[id][moduleId] = defMap ? { ...defMap } : {}
      }
    }
  }

  return next
}

export function getDefaultModuleFeatures(roleId, moduleId, roles) {
  const defaults = getDefaultNestedRbacForRoles(roles)
  const base = defaults[roleId]?.[moduleId]
  if (base && typeof base === 'object') return JSON.parse(JSON.stringify(base))
  const defs = RBAC_MODULE_FEATURES[moduleId] || []
  const leaves = flattenFeatureDefinitions(defs)
  return Object.fromEntries(leaves.map((d) => [d.id, emptyPermissionSet()]))
}
