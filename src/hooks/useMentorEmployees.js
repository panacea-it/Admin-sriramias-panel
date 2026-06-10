import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchMentorsDropdown } from '../api/batchesAPI'
import { isFrontendOnly } from '../config/appMode'
import { useAdminRoles } from '../contexts/AdminRolesContext'
import { listEmployees } from '../utils/employeeAuthStorage'
import {
  EMPLOYEES_UPDATED_EVENT,
  buildMentorSelectOptions,
  formatMentorOptionLabel,
} from '../utils/mentorEmployees'

function mapApiMentorToOption(mentor) {
  const id = mentor._id || mentor.id
  if (!id) return null
  const name = mentor.fullName || mentor.name || '—'
  const roleLabel = mentor.roleTitle || mentor.roleCode || 'Mentor'
  return {
    value: String(id),
    label: formatMentorOptionLabel(
      { name, fullName: name, employeeId: mentor.employeeId },
      roleLabel,
    ),
    employee: {
      _id: id,
      email: mentor.officialEmail || mentor.email || '',
      name,
      fullName: name,
      employeeId: mentor.employeeId || '',
      centerName: mentor.centerName || '',
      centerCode: mentor.centerCode || '',
    },
    roleId: mentor.roleCode || '',
    roleLabel,
  }
}

/** Active batch mentors from Admin API dropdown, with local fallback in frontend-only mode. */
export function useMentorEmployees({ enabled = true } = {}) {
  const { roles } = useAdminRoles()
  const [employees, setEmployees] = useState(() => listEmployees())
  const [apiOptions, setApiOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  const refreshLocal = useCallback(() => {
    setEmployees(listEmployees())
  }, [])

  const loadMentors = useCallback(async () => {
    if (!enabled || isFrontendOnly) return
    setLoading(true)
    try {
      const rows = await fetchMentorsDropdown()
      setApiOptions(
        rows.map(mapApiMentorToOption).filter(Boolean).sort((a, b) => a.label.localeCompare(b.label)),
      )
      setFetchError(null)
    } catch (err) {
      setApiOptions([])
      setFetchError(err?.message || 'Failed to load mentors')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    refreshLocal()
    window.addEventListener(EMPLOYEES_UPDATED_EVENT, refreshLocal)
    return () => window.removeEventListener(EMPLOYEES_UPDATED_EVENT, refreshLocal)
  }, [refreshLocal])

  useEffect(() => {
    if (!enabled) return undefined
    void loadMentors()
    return undefined
  }, [enabled, loadMentors])

  const options = useMemo(() => {
    if (!isFrontendOnly && apiOptions.length) return apiOptions
    return buildMentorSelectOptions(employees, roles)
  }, [apiOptions, employees, roles])

  return { options, loading, error: fetchError, refresh: loadMentors }
}
