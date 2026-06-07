import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import {
  getRoles,
  mapRoleStatusFilterToApi,
  normalizeRolesListResponse,
} from '../services/roleService'

const DEFAULT_PAGE_SIZE = 10

export function useRoleManagement() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 500)

  const [loadError, setLoadError] = useState(null)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = {
        page,
        limit: pageSize,
        status: mapRoleStatusFilterToApi(statusFilter),
      }

      const search = debouncedSearch.trim()
      if (search) {
        params.search = search
      }

      const data = await getRoles(params)
      const normalized = normalizeRolesListResponse(data, { page, limit: pageSize })

      setRoles(normalized.items)
      setTotalItems(normalized.total)
      setTotalPages(normalized.totalPages)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      const message = getApiErrorMessage(error, 'Failed to load roles')
      setLoadError(message)
      toast.error(message)
      setRoles([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, debouncedSearch])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

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

  const removeRoleLocally = useCallback((roleId) => {
    setRoles((prev) => prev.filter((row) => row.id !== roleId))
    setTotalItems((prev) => Math.max(0, prev - 1))
  }, [])

  const patchRoleLocally = useCallback((roleId, patch) => {
    setRoles((prev) => prev.map((row) => (row.id === roleId ? { ...row, ...patch } : row)))
  }, [])

  const resetFilters = useCallback(() => {
    setSearch('')
    setStatusFilter('all')
    setPage(1)
  }, [])

  return {
    roles,
    loading,
    loadError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    refreshRoles: fetchRoles,
    removeRoleLocally,
    patchRoleLocally,
    resetFilters,
  }
}
