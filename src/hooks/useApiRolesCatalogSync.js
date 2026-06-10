import { useEffect } from 'react'
import { useAdminRolesSafe } from '../contexts/AdminRolesContext'
import { fetchAllRoles } from '../services/roleService'
import { mapApiRoleToContextRole } from '../utils/adminRoleMappers'

export async function syncApiRolesCatalog(mergeApiRoles) {
  if (typeof mergeApiRoles !== 'function') return false

  try {
    const apiRoles = await fetchAllRoles()
    if (!Array.isArray(apiRoles) || apiRoles.length === 0) return false

    const mapped = apiRoles.map((row) => mapApiRoleToContextRole(row)).filter(Boolean)
    if (mapped.length > 0) {
      mergeApiRoles(mapped)
      return true
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[syncApiRolesCatalog]', error)
    }
  }

  return false
}

/**
 * Merges API role catalog into AdminRolesContext so the permission matrix
 * and role previews stay aligned with Role Access CRUD.
 */
export function useApiRolesCatalogSync({ enabled = true } = {}) {
  const adminRoles = useAdminRolesSafe()
  const mergeApiRoles = adminRoles?.mergeApiRoles

  useEffect(() => {
    if (!enabled || !mergeApiRoles) return

    let cancelled = false

    async function sync() {
      if (cancelled) return
      await syncApiRolesCatalog(mergeApiRoles)
    }

    sync()

    const onFocus = () => {
      if (!cancelled) sync()
    }
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [enabled, mergeApiRoles])
}
