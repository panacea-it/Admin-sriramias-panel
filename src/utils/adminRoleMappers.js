import {
  DEFAULT_ROLE_ACTIONS,
  createEmptyLegacyModuleMatrix,
} from '../data/adminRolesSeed'
import { mapApiRoleToLocal } from '../services/roleService'

/**
 * Maps an API role record into the AdminRolesContext catalog shape.
 */
export function mapApiRoleToContextRole(data) {
  const mapped = mapApiRoleToLocal(data)
  if (!mapped?.id) return null

  return {
    id: mapped.id,
    label: mapped.label || 'Unnamed role',
    description: mapped.description || '',
    enabled: mapped.enabled,
    systemProtected: mapped.systemProtected,
    fullAccess: mapped.fullAccess,
    iconKey: mapped.fullAccess ? 'shield' : 'badgeCheck',
    securityLevel: mapped.fullAccess ? 'critical' : 'medium',
    modules: mapped.fullAccess ? ['All Modules'] : [],
    permissionCount: mapped.fullAccess ? 48 : 0,
    requiresCenter: !mapped.fullAccess,
    roleActions: { ...DEFAULT_ROLE_ACTIONS },
    legacyModuleMatrix: createEmptyLegacyModuleMatrix(),
    createdAt: mapped.createdAt || new Date().toISOString(),
    updatedAt: mapped.updatedAt || mapped.createdAt || new Date().toISOString(),
  }
}

/**
 * Maps an API role into the Create Admin permission preview card shape.
 */
export function mapApiRoleToPreview(data, fallbackLabel = '') {
  const mapped = mapApiRoleToLocal(data)
  if (!mapped?.id) {
    if (!fallbackLabel) return null
    return {
      id: '',
      label: fallbackLabel,
      description: '',
      securityLevel: 'medium',
      modules: [],
      permissionCount: 0,
    }
  }

  return {
    id: mapped.id,
    label: mapped.label || fallbackLabel || 'Selected role',
    description: mapped.description || '',
    securityLevel: mapped.fullAccess ? 'critical' : 'medium',
    modules: mapped.fullAccess ? ['All Modules', 'Security', 'System Config'] : [],
    permissionCount: mapped.fullAccess ? 48 : 0,
  }
}
