/* eslint-disable react-refresh/only-export-components -- context file exports hooks */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Shield } from 'lucide-react'
import { adminRoleIconMap } from '../utils/adminRoleIcons'
import {
  DEFAULT_ROLE_ACTIONS,
  createEmptyLegacyModuleMatrix,
  SEED_ADMIN_ROLES,
} from '../data/adminRolesSeed'
import {
  getStoredRolesOrSeed,
  saveAdminRoles,
  uniqRoleId,
  slugifyRoleId,
} from '../utils/adminRolesStorage'
import { patchRoleModuleBaseline, pruneRoleFromStoredRbac, clearStoredRbac } from '../utils/rbacStorage'

const AdminRolesContext = createContext(null)

function sortRoleList(a, b) {
  if (a.fullAccess !== b.fullAccess) return a.fullAccess ? -1 : 1
  return String(a.label).localeCompare(String(b.label))
}

function sortSnapshot(list) {
  return [...list].sort(sortRoleList)
}

function migratePatch(prev, patch) {
  let next = { ...prev, ...patch }
  if (patch.legacyModuleMatrix) {
    next.legacyModuleMatrix = { ...createEmptyLegacyModuleMatrix(), ...patch.legacyModuleMatrix }
  }
  if (patch.roleActions) {
    next.roleActions = {
      ...prev.roleActions,
      ...patch.roleActions,
    }
  }
  return next
}

export function AdminRolesProvider({ children }) {
  const [roles, setRoles] = useState(() => getStoredRolesOrSeed())

  useEffect(() => {
    try {
      saveAdminRoles(roles)
    } catch {
      /* handled at mutation */
    }
  }, [roles])

  const matrixRoles = useMemo(
    () =>
      roles.map((r) => ({
        ...r,
        icon: adminRoleIconMap[r.iconKey] || Shield,
      })),
    [roles],
  )

  const selectableAssignableRoles = useMemo(
    () => roles.filter((r) => r.enabled && !r.fullAccess),
    [roles],
  )

  const assignableForNewAdmin = useMemo(
    () => roles.filter((r) => r.enabled && !r.fullAccess),
    [roles],
  )

  const createRole = useCallback(
    (payload) => {
      const existingIds = roles.map((r) => r.id)
      const baseId =
        typeof payload.customId === 'string' && payload.customId.trim()
          ? payload.customId
              .trim()
              .replace(/\s+/g, '_')
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '')
              .slice(0, 56)
          : slugifyRoleId(payload.label || 'role')

      const id = uniqRoleId(baseId || 'custom_role', existingIds)

      const legacyMatrix = payload.legacyModuleMatrix
        ? { ...createEmptyLegacyModuleMatrix(), ...payload.legacyModuleMatrix }
        : createEmptyLegacyModuleMatrix()

      const t = new Date().toISOString()
      const modOn = Object.values(legacyMatrix).filter(Boolean).length
      const next = {
        id,
        label: (payload.label || 'New Role').trim(),
        description: (payload.description || '').trim(),
        enabled: payload.enabled !== false,
        systemProtected: false,
        fullAccess: false,
        iconKey: payload.iconKey || 'badgeCheck',
        securityLevel: payload.securityLevel || 'medium',
        modules: Array.isArray(payload.modules) ? payload.modules : [],
        permissionCount:
          typeof payload.permissionCount === 'number' ? payload.permissionCount : modOn * 6,
        requiresCenter: payload.requiresCenter !== false,
        roleActions: { ...DEFAULT_ROLE_ACTIONS, ...payload.roleActions },
        legacyModuleMatrix: legacyMatrix,
        createdAt: t,
        updatedAt: t,
      }

      setRoles((prev) => sortSnapshot([...prev, next]))
      return next
    },
    [roles],
  )

  const updateRole = useCallback((id, patch) => {
    const t = new Date().toISOString()
    setRoles((prev) =>
      sortSnapshot(
        prev.map((r) => {
          if (r.id !== id) return r
          return migratePatch(r, { ...patch, updatedAt: t })
        }),
      ),
    )
  }, [])

  const setRoleEnabled = useCallback(
    (id, enabled) => {
      const row = roles.find((r) => r.id === id)
      if (!row || row.systemProtected) return
      updateRole(id, { enabled })
    },
    [roles, updateRole],
  )

  const deleteRole = useCallback((id) => {
    const row = roles.find((r) => r.id === id)
    if (!row || row.systemProtected || row.fullAccess) return false
    setRoles((prev) => prev.filter((r) => r.id !== id))
    pruneRoleFromStoredRbac(id)
    return true
  }, [roles])

  const setRoleModuleBaseline = useCallback((roleId, moduleId, on) => {
    setRoles((prev) => {
      const nextList = prev.map((r) => {
        if (r.id !== roleId || r.fullAccess) return r
        return {
          ...r,
          legacyModuleMatrix: { ...r.legacyModuleMatrix, [moduleId]: !!on },
          updatedAt: new Date().toISOString(),
        }
      })
      patchRoleModuleBaseline(roleId, moduleId, on, nextList)
      return sortSnapshot(nextList)
    })
  }, [])

  const resetRolesToSeed = useCallback(() => {
    setRoles(sortSnapshot(JSON.parse(JSON.stringify(SEED_ADMIN_ROLES))))
    clearStoredRbac()
  }, [])

  const mergeApiRoles = useCallback((apiRoles) => {
    if (!Array.isArray(apiRoles) || apiRoles.length === 0) return

    setRoles((prev) => {
      const byId = new Map(prev.map((r) => [r.id, r]))

      for (const incoming of apiRoles) {
        if (!incoming?.id) continue
        const existing = byId.get(incoming.id)
        byId.set(
          incoming.id,
          existing
            ? {
                ...existing,
                label: incoming.label || existing.label,
                description: incoming.description ?? existing.description,
                enabled: incoming.enabled,
                fullAccess: incoming.fullAccess,
                systemProtected: incoming.systemProtected,
                modules: Array.isArray(incoming.modules) ? incoming.modules : existing.modules,
                permissionCount:
                  typeof incoming.permissionCount === 'number'
                    ? incoming.permissionCount
                    : existing.permissionCount,
                updatedAt: incoming.updatedAt || existing.updatedAt,
              }
            : incoming,
        )
      }

      return sortSnapshot([...byId.values()])
    })
  }, [])

  const value = useMemo(
    () => ({
      roles,
      matrixRoles,
      selectableAssignableRoles,
      assignableForNewAdmin,
      createRole,
      updateRole,
      deleteRole,
      setRoleEnabled,
      setRoleModuleBaseline,
      resetRolesToSeed,
      mergeApiRoles,
    }),
    [
      roles,
      matrixRoles,
      selectableAssignableRoles,
      assignableForNewAdmin,
      createRole,
      updateRole,
      deleteRole,
      setRoleEnabled,
      setRoleModuleBaseline,
      resetRolesToSeed,
      mergeApiRoles,
    ],
  )

  return <AdminRolesContext.Provider value={value}>{children}</AdminRolesContext.Provider>
}

export function useAdminRoles() {
  const ctx = useContext(AdminRolesContext)
  if (!ctx) throw new Error('useAdminRoles must be used inside AdminRolesProvider')
  return ctx
}

export function useAdminRolesSafe() {
  return useContext(AdminRolesContext)
}
