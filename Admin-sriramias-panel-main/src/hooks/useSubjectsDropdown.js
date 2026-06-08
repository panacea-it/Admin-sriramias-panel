import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '../utils/apiError'
import { getSubjectsDropdown } from '../services/subjectService'
import { normalizeSubjectsDropdownResponse } from '../pages/academics/categories/subject/subjectHelpers'

export function useSubjectsDropdown({ enabled = true } = {}) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchOptions = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const data = await getSubjectsDropdown()
      setOptions(normalizeSubjectsDropdownResponse(data))
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      setOptions([])
      throw error
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setOptions([])
      return
    }
    fetchOptions().catch(() => {})
  }, [enabled, fetchOptions])

  return { options, loading, refresh: fetchOptions }
}
