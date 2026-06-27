import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { useAdmins } from './admin/useAdmins'
import {
  buildAdminListParams,
  buildRoleFilterOptionsFromAdmins,
  filterAdminsByStatus,
} from '../utils/adminManagementHelpers'

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SORT = 'createdAt:desc'

export function useAdminsManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortPreset, setSortPreset] = useState(DEFAULT_SORT)

  const debouncedSearch = useDebouncedValue(search, 400)

  const listParams = useMemo(
    () =>
      buildAdminListParams({
        page,
        limit: pageSize,
        search: debouncedSearch,
        roleId: roleFilter,
        centerId: centerFilter,
        sortPreset,
      }),
    [page, pageSize, debouncedSearch, roleFilter, centerFilter, sortPreset],
  )

  const { data, isLoading, isFetching, error, refetch } = useAdmins(listParams)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, roleFilter, centerFilter, statusFilter, sortPreset, pageSize])

  const users = useMemo(
    () => filterAdminsByStatus(data?.items ?? [], statusFilter),
    [data?.items, statusFilter],
  )

  const roleFilterOptions = useMemo(
    () => buildRoleFilterOptionsFromAdmins(users),
    [users],
  )

  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const pagination = useMemo(
    () => ({
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [safePage, pageSize, totalItems, totalPages, startIndex, endIndex],
  )

  const resetFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setCenterFilter('all')
    setStatusFilter('all')
    setSortPreset(DEFAULT_SORT)
    setPage(1)
  }

  return {
    users,
    roleFilterOptions,
    loading: isLoading || isFetching,
    loadError: error,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    centerFilter,
    setCenterFilter,
    statusFilter,
    setStatusFilter,
    sortPreset,
    setSortPreset,
    pagination,
    resetFilters,
    refreshUsers: refetch,
    listParams,
  }
}
