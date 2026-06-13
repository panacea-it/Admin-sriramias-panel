import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { isFrontendOnly } from '../config/appMode'
import { getApiErrorMessage } from '../utils/apiError'
import {
  getAdminUsers,
  normalizeAdminUsersListResponse,
} from '../services/adminAccessService'
import { getRolesDropdown, normalizeRolesDropdown } from '../services/roleService'

const FALLBACK_COUNSELORS = [
  { value: 'fallback-1', label: 'Rahul Sharma' },
  { value: 'fallback-2', label: 'Priya Singh' },
  { value: 'fallback-3', label: 'Ankit Verma' },
  { value: 'fallback-4', label: 'Sneha Gupta' },
]

function isCounselorRole(label) {
  return String(label || '').trim().toLowerCase() === 'counselor'
}

async function fetchAllActiveAdminsByRole(roleId) {
  let page = 1
  const limit = 100
  let totalPages = 1
  const items = []

  do {
    const data = await getAdminUsers({
      page,
      limit,
      status: 'ACTIVE',
      roleId,
    })
    const normalized = normalizeAdminUsersListResponse(data, { page, limit })
    items.push(...normalized.items)
    totalPages = normalized.totalPages || 1
    page += 1
  } while (page <= totalPages)

  return items
}

/** Active counselors from Role Access Management (Admin Access API). */
export function useCounselorEmployees({ enabled = true } = {}) {
  const [options, setOptions] = useState(isFrontendOnly ? FALLBACK_COUNSELORS : [])
  const [loading, setLoading] = useState(enabled && !isFrontendOnly)
  const [error, setError] = useState(null)

  const loadCounselors = useCallback(async () => {
    if (!enabled) return

    if (isFrontendOnly) {
      setOptions(FALLBACK_COUNSELORS)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const rolesResponse = await getRolesDropdown()
      const roles = normalizeRolesDropdown(rolesResponse)
      const counselorRole = roles.find((role) => isCounselorRole(role.label))

      if (!counselorRole?.value) {
        setOptions([])
        setError('No Counselor role found in Role Access Management')
        return
      }

      const admins = await fetchAllActiveAdminsByRole(counselorRole.value)
      const mapped = admins
        .map((row) => ({
          value: row.id,
          label: row.employeeName !== '—' ? row.employeeName : row.employeeId,
        }))
        .filter((opt) => opt.value && opt.label && opt.label !== '—')
        .sort((a, b) => a.label.localeCompare(b.label))

      setOptions(mapped)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(err)
      }
      const message = getApiErrorMessage(err, 'Failed to load counselors')
      setError(message)
      toast.error(message)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    loadCounselors()
  }, [loadCounselors])

  const counselorById = useMemo(
    () => Object.fromEntries(options.map((opt) => [opt.value, opt.label])),
    [options],
  )

  return { options, counselorById, loading, error, refresh: loadCounselors }
}
