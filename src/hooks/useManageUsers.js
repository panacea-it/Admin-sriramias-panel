import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { isFrontendOnly } from '../config/appMode'
import { getApiErrorMessage } from '../utils/apiError'
import {
  MANAGE_USERS_STATIC_CENTERS,
  MANAGE_USERS_STATIC_DATA,
} from '../components/manage-users/manageUsersStaticData'
import { useDebouncedValue } from './useDebouncedValue'
import {
  fetchManageUsersList,
  getUserCentersDropdown,
  getUserRolesDropdown,
  normalizeUserCentersDropdown,
  normalizeUserRolesDropdown,
} from '../services/manageUsersService'

const DEFAULT_PAGE_SIZE = 25

function filterStaticUsers(users, { search, roleFilter, centerFilter, statusFilter }) {
  const q = search.trim().toLowerCase()
  return users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (centerFilter !== 'all' && u.assignedCenter !== centerFilter) return false
    if (statusFilter !== 'all' && u.status !== statusFilter) return false
    if (!q) return true
    const hay = [u.fullName, u.email, u.phone, u.userId, u.assignedCenter].join(' ').toLowerCase()
    return hay.includes(q)
  })
}

export function useManageUsers() {
  const [users, setUsers] = useState(isFrontendOnly ? MANAGE_USERS_STATIC_DATA : [])
  const [loading, setLoading] = useState(!isFrontendOnly)
  const [loadError, setLoadError] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(isFrontendOnly ? MANAGE_USERS_STATIC_DATA.length : 0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleOptions, setRoleOptions] = useState([{ value: 'STUDENT', label: 'Student' }])
  const [centerOptions, setCenterOptions] = useState(
    isFrontendOnly ? MANAGE_USERS_STATIC_CENTERS.map((c) => ({ value: c, label: c })) : [],
  )
  const [filtersLoading, setFiltersLoading] = useState(!isFrontendOnly)
  const debouncedSearch = useDebouncedValue(search, 500)

  const fetchFilterOptions = useCallback(async () => {
    if (isFrontendOnly) return

    setFiltersLoading(true)
    try {
      const [rolesData, centersData] = await Promise.all([
        getUserRolesDropdown(),
        getUserCentersDropdown(),
      ])
      setRoleOptions(normalizeUserRolesDropdown(rolesData))
      setCenterOptions(normalizeUserCentersDropdown(centersData))
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to load filter options'))
    } finally {
      setFiltersLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    if (isFrontendOnly) {
      const filtered = filterStaticUsers(MANAGE_USERS_STATIC_DATA, {
        search: debouncedSearch,
        roleFilter,
        centerFilter,
        statusFilter,
      })
      const start = (page - 1) * pageSize
      const slice = filtered.slice(start, start + pageSize)
      setUsers(slice)
      setTotalItems(filtered.length)
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize) || 1))
      setLoadError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const normalized = await fetchManageUsersList({
        page,
        pageSize,
        statusFilter,
        debouncedSearch,
        roleFilter,
        centerFilter,
      })
      setUsers(normalized.items)
      setTotalItems(normalized.total)
      setTotalPages(normalized.totalPages)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      const message = getApiErrorMessage(error, 'Failed to load users')
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
    fetchFilterOptions()
  }, [fetchFilterOptions])

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
    roleOptions,
    centerOptions,
    filtersLoading,
    pagination,
    refreshUsers: fetchUsers,
    refreshFilterOptions: fetchFilterOptions,
    patchUserLocally,
    removeUserLocally,
  }
}
