import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import {
  getCenters,
  mapStatusFilterToApi,
  normalizeCentersListResponse,
} from '../services/centerService'

const DEFAULT_PAGE_SIZE = 10

export function useCenterManagement() {
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 500)

  const fetchCenters = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: pageSize,
        status: mapStatusFilterToApi(statusFilter),
        search: debouncedSearch.trim(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const data = await getCenters(params)
      const normalized = normalizeCentersListResponse(data, { page, limit: pageSize })

      setCenters(normalized.items)
      setTotalItems(normalized.total)
      setTotalPages(normalized.totalPages)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to load centers'))
      setCenters([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, debouncedSearch])

  useEffect(() => {
    fetchCenters()
  }, [fetchCenters])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, pageSize])

  const pagination = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), totalPages)
    const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)

    return {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
    }
  }, [page, pageSize, totalItems, totalPages])

  const patchCenterLocally = useCallback((centerId, patch) => {
    setCenters((prev) =>
      prev.map((row) => (row.centerId === centerId ? { ...row, ...patch } : row)),
    )
  }, [])

  const removeCenterLocally = useCallback((centerId) => {
    setCenters((prev) => prev.filter((row) => row.centerId !== centerId))
    setTotalItems((prev) => Math.max(0, prev - 1))
  }, [])

  return {
    centers,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    refreshCenters: fetchCenters,
    patchCenterLocally,
    removeCenterLocally,
  }
}
