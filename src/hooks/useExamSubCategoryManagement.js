import { useCallback, useEffect, useState } from 'react'
import { toast } from '../utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { getSubCategories } from '../services/examSubCategoryService'
import {
  mapExamSubCategoryStatusFilterToApi,
  normalizeExamSubCategoriesListResponse,
} from '../utils/examSubCategoryApiHelpers'

export function useExamSubCategoryManagement() {
  const [subCategories, setSubCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)

  const fetchSubCategories = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      } else {
        const apiStatus = mapExamSubCategoryStatusFilterToApi(statusFilter)
        if (apiStatus) params.status = apiStatus
        if (centerFilter !== 'all') params.center = centerFilter
        if (programFilter !== 'all') params.program = programFilter
        if (categoryFilter !== 'all') params.category = categoryFilter
      }

      const data = await getSubCategories(params)
      setSubCategories(normalizeExamSubCategoriesListResponse(data))
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to load exam sub-categories'))
      setSubCategories([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, centerFilter, programFilter, categoryFilter])

  useEffect(() => {
    fetchSubCategories()
  }, [fetchSubCategories])

  useEffect(() => {
    setProgramFilter('all')
    setCategoryFilter('all')
  }, [centerFilter])

  useEffect(() => {
    setCategoryFilter('all')
  }, [programFilter])

  const patchSubCategoryLocally = useCallback((subCategoryId, patch) => {
    setSubCategories((prev) =>
      prev.map((row) =>
        String(row.id) === String(subCategoryId) ? { ...row, ...patch } : row,
      ),
    )
  }, [])

  const removeSubCategoryLocally = useCallback((subCategoryId) => {
    setSubCategories((prev) => prev.filter((row) => String(row.id) !== String(subCategoryId)))
  }, [])

  return {
    subCategories,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    programFilter,
    setProgramFilter,
    categoryFilter,
    setCategoryFilter,
    refreshSubCategories: fetchSubCategories,
    patchSubCategoryLocally,
    removeSubCategoryLocally,
  }
}
