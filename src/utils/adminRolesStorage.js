import {
  DEFAULT_ROLE_ACTIONS,
  SEED_ADMIN_ROLES,
  createEmptyLegacyModuleMatrix,
} from '../data/adminRolesSeed'
import { PERMISSION_MODULES } from '../data/adminManagementConfig'

const STORAGE_KEY = 'sriram_admin_role_definitions_v1'

function cloneSeed() {
  return JSON.parse(JSON.stringify(SEED_ADMIN_ROLES))
}

function mergeLegacyRows(role) {
  if (!role?.legacyModuleMatrix || typeof role.legacyModuleMatrix !== 'object')
    return { ...createEmptyLegacyModuleMatrix() }
  const out = { ...createEmptyLegacyModuleMatrix() }
  for (const m of PERMISSION_MODULES) {
    out[m.id] = !!role.legacyModuleMatrix[m.id]
  }
  return out
}

function migrateOne(role) {
  if (!role || typeof role !== 'object') return null
  const mergedLegacy = mergeLegacyRows(role)
  const t = role.updatedAt || role.createdAt || new Date().toISOString()
  return {
    id: role.id,
    label: role.label ?? 'Unnamed role',
    description: role.description ?? '',
    enabled: role.enabled !== false,
    systemProtected: !!role.systemProtected,
    fullAccess: !!role.fullAccess,
    iconKey: role.iconKey || 'badgeCheck',
    securityLevel: role.securityLevel || 'medium',
    modules: Array.isArray(role.modules) ? role.modules : [],
    permissionCount: typeof role.permissionCount === 'number' ? role.permissionCount : 0,
    requiresCenter: role.requiresCenter !== false && !role.fullAccess,
    roleActions: {
      view: role.roleActions?.view !== undefined ? !!role.roleActions.view : DEFAULT_ROLE_ACTIONS.view,
      edit: role.roleActions?.edit !== undefined ? !!role.roleActions.edit : DEFAULT_ROLE_ACTIONS.edit,
      delete: role.roleActions?.delete !== undefined ? !!role.roleActions.delete : DEFAULT_ROLE_ACTIONS.delete,
      disable:
        role.roleActions?.disable !== undefined ? !!role.roleActions.disable : DEFAULT_ROLE_ACTIONS.disable,
    },
    legacyModuleMatrix: mergedLegacy,
    createdAt: role.createdAt || t,
    updatedAt: role.updatedAt || t,
  }
}

/** @returns {{ version: number, roles: import('../contexts/AdminRolesContext').AdminRoleDefinition[]} | null }} */
export function loadAdminRolesEnvelope() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function migrateRolesList(rawRoles) {
  if (!Array.isArray(rawRoles) || rawRoles.length === 0) return cloneSeed()

  const seedBaseline = cloneSeed()
  const seedIds = new Set(seedBaseline.map((r) => r.id))
  const migrated = rawRoles.map(migrateOne).filter(Boolean)

  const mergedCanonical = seedBaseline.map((seed) => {
    const hit = migrated.find((m) => m.id === seed.id)
    return hit
      ? migrateOne({
          ...seed,
          ...hit,
          systemProtected: seed.systemProtected,
          fullAccess: seed.fullAccess,
          id: seed.id,
        })
      : seed
  })

  const known = new Set(mergedCanonical.map((r) => r.id))
  for (const row of migrated) {
    if (!seedIds.has(row.id) && !known.has(row.id)) {
      mergedCanonical.push(row)
      known.add(row.id)
    }
  }

  mergedCanonical.sort((a, b) => {
    if (a.fullAccess !== b.fullAccess) return a.fullAccess ? -1 : 1
    return a.label.localeCompare(b.label)
  })

  const superOk = mergedCanonical.some((r) => r.id === 'super_admin' && r.fullAccess && r.systemProtected)
  if (!superOk) return cloneSeed()

  return mergedCanonical
}

export function getStoredRolesOrSeed() {
  const env = loadAdminRolesEnvelope()
  if (!env?.roles?.length) return cloneSeed()
  return migrateRolesList(env.roles)
}

export function saveAdminRoles(roles) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), roles }),
    )
  } catch (e) {
    console.error('saveAdminRoles failed', e)
    throw e
  }
}

export function slugifyRoleId(label) {
  const base = String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
  return base || 'role'
}

export function uniqRoleId(base, existingIds) {
  let id = base
  let n = 0
  const set = new Set(existingIds)
  while (set.has(id)) {
    n += 1
    id = `${base}_${n}`
  }
  return id
}
