import { PERMISSION_MODULES } from '../data/adminManagementConfig'
import { RBAC_MODULE_FEATURES } from '../data/rbacConfig'
import {
  emptyPermissionSet,
  fullPermissionSet,
  isFeaturePermissionActive,
  summarizeFeatureMap,
} from './rbacPermissionModel'

/**
 * @typedef {'full' | 'custom' | 'restricted'} ModuleAccessStatus
 */

/** Aggregate feature booleans → matrix cell status chip. */
export function deriveModuleAccessStatus(featureMap) {
  if (!featureMap || typeof featureMap !== 'object') return 'restricted'

  const values = Object.values(featureMap || {})
  if (values.length === 0) return 'restricted'

  const enabled = values.filter((v) => isFeaturePermissionActive(v)).length
  const total = values.length

  if (enabled === 0) return 'restricted'
  if (enabled === total) return 'full'
  return 'custom'
}

export function featureSummary(featureMap) {
  return summarizeFeatureMap(featureMap)
}

export function buildFullFeatureMap(moduleId) {
  const defs = RBAC_MODULE_FEATURES[moduleId] || []
  return Object.fromEntries(defs.map((d) => [d.id, fullPermissionSet()]))
}

export function buildEmptyFeatureMap(moduleId) {
  const defs = RBAC_MODULE_FEATURES[moduleId] || []
  return Object.fromEntries(defs.map((d) => [d.id, emptyPermissionSet()]))
}

/**
 * @param {Record<string, Record<string, boolean>>} legacyMatrix roleId → moduleId → boolean
 * @param {Array<{ id: string, fullAccess?: boolean }>} roles all role definitions (fullAccess rows skipped)
 */
export function buildNestedRbacFromLegacy(legacyMatrix, roles) {
  const out = {}

  for (const role of roles) {
    if (role.fullAccess) continue

    out[role.id] = {}

    for (const mod of PERMISSION_MODULES) {
      const legacyOn = !!(legacyMatrix[role.id] && legacyMatrix[role.id][mod.id])

      const defs = RBAC_MODULE_FEATURES[mod.id]
      if (!defs?.length) continue

      out[role.id][mod.id] = Object.fromEntries(
        defs.map((d) => [d.id, legacyOn ? fullPermissionSet() : emptyPermissionSet()]),
      )
    }
  }

  return out
}

export function extractLegacyMatrixFromRoles(roles) {
  const m = {}
  for (const r of roles) {
    if (r.fullAccess) continue
    m[r.id] = { ...(r.legacyModuleMatrix || {}) }
  }
  return m
}

export function getDefaultNestedRbacForRoles(roles) {
  const matrix = extractLegacyMatrixFromRoles(roles)
  return buildNestedRbacFromLegacy(matrix, roles)
}

export function cloneNestedRbac(state) {
  return JSON.parse(JSON.stringify(state))
}

/**
 * API-friendly structured export (pairs with POST / rbac save later).
 */
export function rbacStateToRolesPayload(nestedState) {
  const rolesArr = []

  for (const [roleId, modules] of Object.entries(nestedState)) {
    const permissions = {}
    for (const [moduleId, features] of Object.entries(modules || {})) {
      permissions[moduleId] = {
        access: deriveModuleAccessStatus(features),
        features: { ...features },
      }
    }

    rolesArr.push({
      role: roleId,
      permissions,
    })
  }

  return {
    version: 1,
    featureAccessModel: 'boolean',
    futureLevelsSupported: ['view_only', 'edit', 'delete', 'full'],
    roles: rolesArr,
  }
}

/** Enterprise export: nested feature RBAC plus role-definition metadata & role-actions. */
export function rbacStateToFullExport(nestedState, roleDefinitions) {
  const rbac = rbacStateToRolesPayload(nestedState)
  const rbacByRole = Object.fromEntries((rbac.roles || []).map((r) => [r.role, r]))

  const roleDefinitionsSafe = roleDefinitions.map((r) => ({
    id: r.id,
    label: r.label,
    description: r.description,
    enabled: r.enabled,
    fullAccess: !!r.fullAccess,
    systemProtected: !!r.systemProtected,
    securityLevel: r.securityLevel,
    requiresCenter: r.requiresCenter,
    iconKey: r.iconKey,
    modules: Array.isArray(r.modules) ? [...r.modules] : [],
    permissionCount: r.permissionCount,
    roleActions: { ...(r.roleActions || {}) },
    legacyModuleMatrix: { ...(r.legacyModuleMatrix || {}) },
    permissions: rbacByRole[r.id]?.permissions || {},
  }))

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    rbac,
    roles: roleDefinitionsSafe,
    roleDefinitions: roleDefinitionsSafe,
  }
}
