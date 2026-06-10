import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchStudyMaterialCategoriesDropdown } from '../api/freeResourcesAPI'
import { createCachedRequest } from '../utils/apiRequestCache'
import {
  DEFAULT_STUDY_MATERIAL_CATEGORY_OPTIONS,
  normalizeStudyMaterialCategoryDropdownOptions,
} from '../utils/freeResourceApiHelpers'

const CATEGORY_CACHE_KEY = 'study-material-categories'
const categoryCache = createCachedRequest({ ttlMs: 5 * 60_000 })

export function useStudyMaterialDropdowns(open, enabled) {
  const [categoryOptions, setCategoryOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const requestIdRef = useRef(0)

  const applyCachedDropdowns = useCallback(() => {
    const cached = categoryCache.getCached(CATEGORY_CACHE_KEY)
    if (cached === undefined) return false

    setCategoryOptions(normalizeStudyMaterialCategoryDropdownOptions(cached))
    setLoading(false)
    setError(null)
    return true
  }, [])

  const loadDropdowns = useCallback(async ({ bypassCache = false } = {}) => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const data = await categoryCache.fetch(
        CATEGORY_CACHE_KEY,
        () => fetchStudyMaterialCategoriesDropdown({ signal: controller.signal }),
        { bypass: bypassCache },
      )

      if (controller.signal.aborted || requestIdRef.current !== requestId) return

      const options = normalizeStudyMaterialCategoryDropdownOptions(data)
      setCategoryOptions(options)
      setError(null)
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
      if (requestIdRef.current !== requestId) return

      setCategoryOptions(DEFAULT_STUDY_MATERIAL_CATEGORY_OPTIONS)
      setError(null)
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort()
      categoryCache.clear(CATEGORY_CACHE_KEY)
      setLoading(false)
      setError(null)
      return undefined
    }

    if (!enabled) {
      abortRef.current?.abort()
      setLoading(false)
      return undefined
    }

    if (applyCachedDropdowns()) {
      return () => {
        abortRef.current?.abort()
      }
    }

    loadDropdowns()

    return () => {
      abortRef.current?.abort()
    }
  }, [open, enabled, loadDropdowns, applyCachedDropdowns])

  const retry = useCallback(() => {
    loadDropdowns({ bypassCache: true })
  }, [loadDropdowns])

  return {
    categoryOptions,
    loading,
    error,
    retry,
  }
}
