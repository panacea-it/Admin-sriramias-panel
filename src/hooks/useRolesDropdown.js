import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { getRolesDropdown, normalizeRolesDropdown } from '../services/roleService'
import { fetchRolesDropdownOptions } from '../services/adminAccessService'

export function useRolesDropdown({ enabled = true, adminManagement = false } = {}) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const normalized = adminManagement
        ? await fetchRolesDropdownOptions()
        : normalizeRolesDropdown(await getRolesDropdown())

      setOptions(Array.isArray(normalized) ? normalized : [])
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(err)
      }
      const message = getApiErrorMessage(err, 'Failed to load roles')
      setError(message)
      toast.error(message)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [adminManagement])

  useEffect(() => {
    if (!enabled) return
    fetchOptions()
  }, [enabled, fetchOptions])

  return { options, loading, error, refresh: fetchOptions }
}
