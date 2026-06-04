import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { getRolesDropdown, normalizeRolesDropdown } from '../services/roleService'

export function useRolesDropdown({ enabled = true } = {}) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rolesResponse = await getRolesDropdown()
      if (import.meta.env.DEV) {
        console.log('Roles Response:', rolesResponse)
      }
      const normalized = normalizeRolesDropdown(rolesResponse)
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
  }, [])

  useEffect(() => {
    if (!enabled) return
    fetchOptions()
  }, [enabled, fetchOptions])

  return { options, loading, error, refresh: fetchOptions }
}
