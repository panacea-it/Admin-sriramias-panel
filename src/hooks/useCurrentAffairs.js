import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import {
  mapUiCategoryToApi,
  mapUiStatusFilterToApi,
} from '../utils/currentAffairsApiHelpers'
import { fetchAllCurrentAffairs } from '../services/currentAffairsService'

function applyClientFilters(items, { categoryFilter, resourceFilter }) {
  return items.filter((row) => {
    if (categoryFilter && categoryFilter !== 'all' && row.category !== categoryFilter) {
      return false
    }
    if (resourceFilter && resourceFilter !== 'all' && row.category !== resourceFilter) {
      return false
    }
    return true
  })
}

function buildListParams({ debouncedSearch, categoryFilter, resourceFilter, statusFilter }) {
  const params = {}

  const search = debouncedSearch.trim()
  if (search) {
    params.search = search
  }

  const typeFilter =
    resourceFilter && resourceFilter !== 'all'
      ? resourceFilter
      : categoryFilter && categoryFilter !== 'all'
        ? categoryFilter
        : null

  if (typeFilter) {
    const apiCategory = mapUiCategoryToApi(typeFilter)
    params.category = apiCategory
    params.resource = apiCategory
  }

  const status = mapUiStatusFilterToApi(statusFilter)
  if (status !== undefined) {
    params.status = status
  }

  return params
}

export function useCurrentAffairs() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [resourceFilter, setResourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = buildListParams({
        debouncedSearch,
        categoryFilter,
        resourceFilter,
        statusFilter,
      })
      const rows = await fetchAllCurrentAffairs(params)
      setItems(applyClientFilters(rows, { categoryFilter, resourceFilter }))
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Current Affairs] Failed to load list:', error)
      }
      const message = getApiErrorMessage(error, 'Failed to load current affairs')
      setLoadError(message)
      toast.error(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, categoryFilter, resourceFilter, statusFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const removeItemsLocally = useCallback((ids) => {
    const idSet = new Set(ids.map(String))
    setItems((prev) => prev.filter((row) => !idSet.has(String(row.id))))
  }, [])

  const patchItemLocally = useCallback((id, patch) => {
    setItems((prev) =>
      prev.map((row) => (String(row.id) === String(id) ? { ...row, ...patch } : row)),
    )
  }, [])

  return {
    items,
    loading,
    loadError,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    resourceFilter,
    setResourceFilter,
    statusFilter,
    setStatusFilter,
    refreshItems: fetchItems,
    removeItemsLocally,
    patchItemLocally,
  }
}
