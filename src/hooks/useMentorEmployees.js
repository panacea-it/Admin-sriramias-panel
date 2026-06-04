import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAdminRoles } from '../contexts/AdminRolesContext'
import { listEmployees } from '../utils/employeeAuthStorage'
import {
  EMPLOYEES_UPDATED_EVENT,
  buildMentorSelectOptions,
} from '../utils/mentorEmployees'

/** Active batch mentors from Admin Management, auto-refreshed on employee/role changes. */
export function useMentorEmployees() {
  const { roles } = useAdminRoles()
  const [employees, setEmployees] = useState(() => listEmployees())

  const refresh = useCallback(() => {
    setEmployees(listEmployees())
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(EMPLOYEES_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(EMPLOYEES_UPDATED_EVENT, refresh)
  }, [refresh])

  const options = useMemo(
    () => buildMentorSelectOptions(employees, roles),
    [employees, roles],
  )

  return { options, refresh }
}
