import { RBAC_MODULE_FEATURES } from '../data/rbacConfig'
import { flattenFeatureDefinitions } from './rbacPermissionModel'

const featureCache = new Map()

/** Leaf feature labels for a permission module (cached for matrix tooltips). */
export function getModuleFeatureLabels(moduleId) {
  if (featureCache.has(moduleId)) return featureCache.get(moduleId)
  const defs = RBAC_MODULE_FEATURES[moduleId] || []
  const labels = flattenFeatureDefinitions(defs).map((f) => f.label)
  featureCache.set(moduleId, labels)
  return labels
}

export function getModuleFeatureCount(moduleId) {
  return getModuleFeatureLabels(moduleId).length
}
