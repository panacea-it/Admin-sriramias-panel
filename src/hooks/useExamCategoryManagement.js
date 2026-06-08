import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import {
  clearExamCategoriesListCache,
  getExamCategories,
} from '../services/examCategoryService'
import {
  mapExamCategoryStatusFilterToApi,
  normalizeExamCategoriesListResponse,
} from '../utils/examCategoryApiHelpers'

function isRateLimited(error) {
  if (error?.response?.status === 429) return true
  const message = getApiErrorMessage(error, '').toLowerCase()
  return message.includes('too many requests')
}

function buildListParams({ debouncedSearch, statusFilter, centerFilter, programFilter }) {
  const params = {
    search: debouncedSearch.trim(),
  }

  const apiStatus = mapExamCategoryStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus
  if (centerFilter !== 'all') params.center = centerFilter
  if (programFilter !== 'all') params.program = programFilter

  return params
}

export function useExamCategoryManagement() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)
  const lastErrorToastAt = useRef(0)

  const loadCategories = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({
        debouncedSearch,
        statusFilter,
        centerFilter,
        programFilter,
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
    [debouncedSearch, statusFilter, centerFilter, programFilter],
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
    categories,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    programFilter,
    setProgramFilter,
    refreshCategories,
    patchCategoryLocally,
    removeCategoryLocally,
  }
}
