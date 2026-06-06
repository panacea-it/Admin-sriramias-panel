import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import {
  mapUiCategoryToApi,
  mapUiStatusFilterToApi,
} from '../utils/currentAffairsApiHelpers'
import { fetchAllCurrentAffairs } from '../services/currentAffairsService'

function buildListParams({ debouncedSearch, categoryFilter, statusFilter }) {
  const params = {}

  const search = debouncedSearch.trim()
  if (search) {
    params.search = search
  }

  if (categoryFilter && categoryFilter !== 'all') {
    params.category = mapUiCategoryToApi(categoryFilter)
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
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = buildListParams({ debouncedSearch, categoryFilter, statusFilter })
      const rows = await fetchAllCurrentAffairs(params)
      setItems(rows)
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
  }, [debouncedSearch, categoryFilter, statusFilter])

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
    statusFilter,
    setStatusFilter,
    refreshItems: fetchItems,
    removeItemsLocally,
    patchItemLocally,
  }
}
