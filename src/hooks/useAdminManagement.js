import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import {
  getAdminUsers,
  mapAdminStatusFilterToApi,
  normalizeAdminUsersListResponse,
} from '../services/adminAccessService'

const DEFAULT_PAGE_SIZE = 10

function buildListParams({ page, pageSize, statusFilter, debouncedSearch, roleFilter, centerFilter }) {
  const params = {
    page,
    limit: pageSize,
    status: mapAdminStatusFilterToApi(statusFilter),
  }

  const search = debouncedSearch.trim()
  if (search) {
    params.search = search
  }

  if (roleFilter && roleFilter !== 'all') {
    params.roleId = roleFilter
  }

  if (centerFilter && centerFilter !== 'all') {
    params.centerId = centerFilter
  }

  return params
}

export function useAdminManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = buildListParams({
        page,
        pageSize,
        statusFilter,
        debouncedSearch,
        roleFilter,
        centerFilter,
      })

      const data = await getAdminUsers(params)
      const normalized = normalizeAdminUsersListResponse(data, { page, limit: pageSize })

      setUsers(normalized.items)
      setTotalItems(normalized.total)
      setTotalPages(normalized.totalPages)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      const message = getApiErrorMessage(error, 'Failed to load admin users')
      setLoadError(message)
      toast.error(message)
      setUsers([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, debouncedSearch, roleFilter, centerFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, roleFilter, centerFilter, statusFilter, pageSize])

  const pagination = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages))
    const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)

    return {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }
  }, [page, pageSize, totalItems, totalPages])

  const resetFilters = useCallback(() => {
    setSearch('')
    setRoleFilter('all')
    setCenterFilter('all')
    setStatusFilter('all')
    setPage(1)
  }, [])

  const patchUserLocally = useCallback((userId, patch) => {
    setUsers((prev) => prev.map((row) => (row.id === userId ? { ...row, ...patch } : row)))
  }, [])

  const removeUserLocally = useCallback((userId) => {
    setUsers((prev) => prev.filter((row) => row.id !== userId))
    setTotalItems((prev) => Math.max(0, prev - 1))
  }, [])

  return {
    users,
    loading,
    loadError,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    centerFilter,
    setCenterFilter,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    resetFilters,
    refreshUsers: fetchUsers,
    patchUserLocally,
    removeUserLocally,
  }
}
