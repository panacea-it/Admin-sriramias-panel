import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import {
  clearExamCategoriesListCache,
  getExamCategories,
} from '../services/examCategoryService'
import {
  mapExamCategoryStatusFilterToApi,
  normalizeExamCategoriesListResponse,
} from '../utils/examCategoryApiHelpers'
import { matchesExamCategorySearch } from '../utils/examCategoryHelpers'

function isRateLimited(error) {
  if (error?.response?.status === 429) return true
  const message = getApiErrorMessage(error, '').toLowerCase()
  return message.includes('too many requests')
}

function buildListParams({ statusFilter, centerFilter }) {
  const params = {}

  const apiStatus = mapExamCategoryStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus
  if (centerFilter !== 'all') params.center = centerFilter

  return params
}

export function useExamCategoryManagement() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const lastErrorToastAt = useRef(0)

  const loadCategories = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({
        statusFilter,
        centerFilter,
      })

      setLoading(true)
      try {
        const data = await getExamCategories(params, { bypassCache })
        if (ignoreFlag?.()) return
        setCategories(normalizeExamCategoriesListResponse(data))
      } catch (error) {
        if (ignoreFlag?.()) return
        if (import.meta.env.DEV) {
          console.error(error)
        }
        if (!isRateLimited(error)) {
          const now = Date.now()
          if (now - lastErrorToastAt.current > 4000) {
            lastErrorToastAt.current = now
            toast.error(getApiErrorMessage(error, 'Failed to load exam categories'))
          }
          setCategories([])
        }
      } finally {
        if (!ignoreFlag?.()) {
          setLoading(false)
        }
      }
    },
    [statusFilter, centerFilter],
  )

  const filteredCategories = useMemo(
    () => categories.filter((row) => matchesExamCategorySearch(row, search)),
    [categories, search],
  )

  useEffect(() => {
    let ignore = false
    loadCategories({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadCategories])

  const refreshCategories = useCallback(async () => {
    clearExamCategoriesListCache()
    await loadCategories({ bypassCache: true })
  }, [loadCategories])

  const patchCategoryLocally = useCallback((categoryId, patch) => {
    setCategories((prev) =>
      prev.map((row) => (String(row.id) === String(categoryId) ? { ...row, ...patch } : row)),
    )
  }, [])

  const removeCategoryLocally = useCallback((categoryId) => {
    setCategories((prev) => prev.filter((row) => String(row.id) !== String(categoryId)))
  }, [])

  return {
    categories: filteredCategories,
    totalCategories: categories.length,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    refreshCategories,
    patchCategoryLocally,
    removeCategoryLocally,
  }
}
