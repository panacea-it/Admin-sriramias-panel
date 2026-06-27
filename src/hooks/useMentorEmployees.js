import { useEffect, useState } from 'react'
import { fetchMentorsDropdown } from '../api/batchesAPI'
import adminManagementService from '../services/adminManagementService'
import { isRecordStatusActive } from '../constants/recordStatus'
import {
  mapRolesDropdownResponse,
  normalizeAdminListResponse,
} from '../utils/adminManagementHelpers'
import {
  isMentorAdminRole,
  mapMentorDropdownRow,
} from '../utils/mentorEmployees'

const LOAD_ERROR = 'Unable to load mentors'

async function fetchActiveMentorAdminsFromAccess() {
  const rolesData = await adminManagementService.getRolesDropdown()
  const roles = mapRolesDropdownResponse(rolesData)
  const mentorRole = roles.find(isMentorAdminRole)

  if (!mentorRole?.value) {
    if (import.meta.env.DEV) {
      console.warn('[batch mentor dropdown] No Mentor Admin role found in roles dropdown')
    }
    return []
  }

  let page = 1
  const limit = 100
  let totalPages = 1
  const items = []

  do {
    const listData = await adminManagementService.getAdmins({
      page,
      limit,
      roleId: mentorRole.value,
    })
    const normalized = normalizeAdminListResponse(listData, { page, limit })
    items.push(
      ...normalized.items.filter((row) => isRecordStatusActive(row.status)),
    )
    totalPages = normalized.totalPages || 1
    page += 1
  } while (page <= totalPages)

  return items.map((row) => ({
    _id: row.id,
    id: row.id,
    fullName: row.fullName,
    name: row.fullName,
    employeeName: row.employeeName,
    employeeId: row.employeeId,
    roleCode: row.roleCode,
    roleTitle: row.roleTitle,
  }))
}

/** Batch mentor dropdown — mentors/dropdown first, admin-access fallback when empty. */
export function useMentorEmployees({ enabled = false } = {}) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) {
      setOptions([])
      setError(null)
      setLoading(false)
      return undefined
    }

    const ac = new AbortController()
    let active = true
    setLoading(true)
    setError(null)
    setOptions([])

    ;(async () => {
      try {
        let rows = await fetchMentorsDropdown({ signal: ac.signal })

        if (!rows.length) {
          rows = await fetchActiveMentorAdminsFromAccess()
          if (import.meta.env.DEV && rows.length) {
            console.log(
              '[batch mentor dropdown] mentors/dropdown was empty; loaded from admin-access',
              rows,
            )
          }
        }

        if (!active) return

        if (import.meta.env.DEV) {
          console.log('[batch mentor dropdown] API rows', rows)
        }

        setOptions(
          rows
            .map(mapMentorDropdownRow)
            .filter(Boolean)
            .sort((a, b) => a.label.localeCompare(b.label)),
        )
        setError(null)
      } catch (err) {
        if (!active) return
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        setOptions([])
        setError(err?.message || LOAD_ERROR)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
      ac.abort()
    }
  }, [enabled])

  return { options, loading, error }
}
