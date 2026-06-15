import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import {
  mapUiCategoryToApi,
  mapUiStatusFilterToApi,
} from '../utils/currentAffairsApiHelpers'
import { fetchAllCurrentAffairs } from '../services/currentAffairsService'

function applyClientFilters(items, { categoryFilter, resourceFilter, search }) {
  const query = String(search || '').trim().toLowerCase()

  return items.filter((row) => {
    if (categoryFilter && categoryFilter !== 'all' && row.category !== categoryFilter) {
      return false
    }
    if (resourceFilter && resourceFilter !== 'all' && row.category !== resourceFilter) {
      return false
    }
    if (query) {
      const name = String(row.name || '').toLowerCase()
      const category = String(row.category || '').toLowerCase()
      if (!name.includes(query) && !category.includes(query)) {
        return false
      }
    }
    return true
  })
}

function buildListParams({ categoryFilter, resourceFilter, statusFilter }) {
  const params = {}

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
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [resourceFilter, setResourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const items = useMemo(
    () => applyClientFilters(allItems, { categoryFilter, resourceFilter, search }),
    [allItems, categoryFilter, resourceFilter, search],
  )

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = buildListParams({
        categoryFilter,
        resourceFilter,
        statusFilter,
      })
      const rows = await fetchAllCurrentAffairs(params)
      setAllItems(rows)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Current Affairs] Failed to load list:', error)
      }
      const message = getApiErrorMessage(error, 'Failed to load current affairs')
      setLoadError(message)
      toast.error(message)
      setAllItems([])
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, resourceFilter, statusFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const removeItemsLocally = useCallback((ids) => {
    const idSet = new Set(ids.map(String))
    setAllItems((prev) => prev.filter((row) => !idSet.has(String(row.id))))
  }, [])

  const patchItemLocally = useCallback((id, patch) => {
    setAllItems((prev) =>
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
