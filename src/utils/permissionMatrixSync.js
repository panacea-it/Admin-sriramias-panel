import { PERMISSION_MODULES } from '../data/adminManagementConfig'
import { RBAC_MODULE_FEATURES } from '../data/rbacConfig'
import {
  cloneNestedRbac,
  deriveModuleAccessStatus,
  getDefaultNestedRbacForRoles,
} from './rbacHelpers'
import {
  emptyPermissionSet,
  flattenFeatureDefinitions,
  fullPermissionSet,
  isFeaturePermissionActive,
} from './rbacPermissionModel'

export const FRONTEND_MODULE_TO_BACKEND = {
  academics: 'ACADEMICS',
  test_management: 'TEST_MANAGEMENT',
  users_access: 'USERS_ACCESS',
  engagement_crm: 'ENGAGEMENT_CRM',
  content_marketing: 'CONTENT_MARKETING',
  finance_operation: 'FINANCE_OPERATIONS',
  operations: 'OPERATIONS',
  system_tools: 'SYSTEM_TOOLS',
}

export const BACKEND_MODULE_TO_FRONTEND = Object.fromEntries(
  Object.entries(FRONTEND_MODULE_TO_BACKEND).map(([frontend, backend]) => [backend, frontend]),
)

function featureKeyMatchesLeaf(featureKey, leafId) {
  const keyParts = String(featureKey || '')
    .toLowerCase()
    .split('_')
    .filter((part) => part.length > 2)
  const leaf = String(leafId || '').toLowerCase()
  if (!keyParts.length || !leaf) return false
  return keyParts.some((part) => leaf.includes(part) || part.includes(leaf))
}

export function buildPermissionMatrixIndex(apiData) {
  const index = {}

  for (const roleSummary of apiData?.data || []) {
    const roleId = String(roleSummary?.role?._id || '')
    if (!roleId) continue

    index[roleId] = index[roleId] || {}

    for (const mod of roleSummary?.modules || []) {
      index[roleId][mod.moduleKey] = {
        matrixId: mod._id,
        permissions: Array.isArray(mod.permissions) ? mod.permissions : [],
      }
    }
  }

  return index
}

export function backendMatrixToNestedRbac(apiData, roles) {
  const base = getDefaultNestedRbacForRoles(roles)
  const next = cloneNestedRbac(base)

  for (const roleSummary of apiData?.data || []) {
    const roleId = String(roleSummary?.role?._id || '')
    if (!next[roleId]) continue

    for (const mod of roleSummary?.modules || []) {
      const moduleId = BACKEND_MODULE_TO_FRONTEND[mod.moduleKey]
      if (!moduleId || !next[roleId][moduleId]) continue

      const leaves = flattenFeatureDefinitions(RBAC_MODULE_FEATURES[moduleId] || [])
      if (!leaves.length) continue

      for (const leaf of leaves) {
        next[roleId][moduleId][leaf.id] = emptyPermissionSet()
      }

      for (const perm of mod.permissions || []) {
        if (!perm?.allowed) continue

        for (const leaf of leaves) {
          if (featureKeyMatchesLeaf(perm.featureKey, leaf.id)) {
            next[roleId][moduleId][leaf.id] = fullPermissionSet()
          }
        }
      }
    }
  }

  return next
}

export function nestedRbacToBulkUpdates(nestedState, matrixIndex, roles) {
  const fullAccessRoleIds = new Set(
    (roles || []).filter((role) => role.fullAccess).map((role) => String(role.id)),
  )
  const updates = []

  for (const [roleId, modules] of Object.entries(nestedState || {})) {
    if (fullAccessRoleIds.has(String(roleId))) continue

    for (const mod of PERMISSION_MODULES) {
      const backendKey = FRONTEND_MODULE_TO_BACKEND[mod.id]
      if (!backendKey) continue

      const matrixDoc = matrixIndex?.[roleId]?.[backendKey]
      if (!matrixDoc?.matrixId) continue

      const featureMap = modules?.[mod.id]
      const status = deriveModuleAccessStatus(featureMap, mod.id)

      if (status === 'full') {
        updates.push({ matrixId: matrixDoc.matrixId, action: 'enable_all' })
        continue
      }

      if (status === 'restricted') {
        updates.push({ matrixId: matrixDoc.matrixId, action: 'restrict_all' })
        continue
      }

      const leaves = flattenFeatureDefinitions(RBAC_MODULE_FEATURES[mod.id] || [])
      const features = (matrixDoc.permissions || []).map((perm) => {
        const allowed = leaves.some(
          (leaf) =>
            featureKeyMatchesLeaf(perm.featureKey, leaf.id) &&
            isFeaturePermissionActive(featureMap?.[leaf.id]),
        )
        return {
          featureKey: perm.featureKey,
          allowed,
        }
      })

      if (features.length) {
        updates.push({
          matrixId: matrixDoc.matrixId,
          action: 'set_features',
          features,
        })
      }
    }
  }

  return updates
}
