import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchResourceCategoriesDropdown } from '../api/freeResourcesAPI'
import { createCachedRequest } from '../utils/apiRequestCache'
import {
  DEFAULT_RESOURCE_CATEGORY_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
  normalizeResourceCategoryOptions,
} from '../utils/freeResourceApiHelpers'

const CATEGORY_CACHE_KEY = 'free-resource-categories'
const categoryCache = createCachedRequest({ ttlMs: 5 * 60_000 })

export function useFreeResourceFormDropdowns(open) {
  const [categoryOptions, setCategoryOptions] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState(null)
  const abortRef = useRef(null)
  const modalOpenRef = useRef(false)

  const loadDropdowns = useCallback(async ({ bypassCache = false } = {}) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setCategoriesLoading(true)
    setCategoriesError(null)

    try {
      const categoriesData = await categoryCache.fetch(
        CATEGORY_CACHE_KEY,
        () => fetchResourceCategoriesDropdown({ signal: controller.signal }),
        { bypass: bypassCache },
      )

      if (controller.signal.aborted) return

      setCategoryOptions(normalizeResourceCategoryOptions(categoriesData))
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
      setCategoriesError(null)
      setCategoryOptions(DEFAULT_RESOURCE_CATEGORY_OPTIONS)
    } finally {
      if (!controller.signal.aborted) {
        setCategoriesLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort()
      if (modalOpenRef.current) {
        categoryCache.clear(CATEGORY_CACHE_KEY)
      }
      modalOpenRef.current = false
      return undefined
    }

    modalOpenRef.current = true

    const cached = categoryCache.getCached(CATEGORY_CACHE_KEY)
    if (cached !== undefined) {
      setCategoryOptions(normalizeResourceCategoryOptions(cached))
      setCategoriesLoading(false)
      setCategoriesError(null)
      return () => {
        abortRef.current?.abort()
      }
    }

    loadDropdowns()

    return () => {
      abortRef.current?.abort()
    }
  }, [open, loadDropdowns])

  const retryCategories = useCallback(() => {
    loadDropdowns({ bypassCache: true })
  }, [loadDropdowns])

  return {
    categoryOptions,
    statusOptions: DEFAULT_STATUS_OPTIONS,
    categoriesLoading,
    categoriesError,
    retryCategories,
  }
}
