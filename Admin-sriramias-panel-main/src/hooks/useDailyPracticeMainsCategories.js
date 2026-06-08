import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { MAINS_CATEGORY_OPTIONS } from '../constants/currentAffairsForm'
import { getApiErrorMessage } from '../utils/apiError'
import { getDailyPracticeMainsCategories } from '../services/currentAffairsService'

const FALLBACK_OPTIONS = MAINS_CATEGORY_OPTIONS.map((name) => ({ value: name, label: name }))

export function useDailyPracticeMainsCategories({ enabled = true } = {}) {
  const [options, setOptions] = useState(FALLBACK_OPTIONS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const fetchOptions = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const rows = await getDailyPracticeMainsCategories()
      if (!mountedRef.current) return
      setOptions(rows.length ? rows : FALLBACK_OPTIONS)
    } catch (err) {
      if (!mountedRef.current) return
      if (import.meta.env.DEV) {
        console.error('[Daily Practice] Failed to load mains categories:', err)
      }
      const message = getApiErrorMessage(err, 'Failed to load mains categories')
      setError(message)
      setOptions(FALLBACK_OPTIONS)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [enabled])

  useEffect(() => {
    mountedRef.current = true
    if (enabled) {
      fetchOptions()
    }
    return () => {
      mountedRef.current = false
    }
  }, [enabled, fetchOptions])

  return {
    options,
    loading,
    error,
    refresh: fetchOptions,
  }
}
