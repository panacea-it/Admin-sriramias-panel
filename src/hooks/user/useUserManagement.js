import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '../useDebouncedValue'
import { buildFilterSignature, useEffectivePage } from '../useMasterListQuery'
import { buildUserListParams } from '../../utils/userHelpers'
import { useUsers } from './useUsers'
import { useUserRolesDropdown } from './useUserRolesDropdown'
import { useUserCentersDropdown } from './useUserCentersDropdown'
import { useUserModuleConfig } from './useUserModuleConfig'

const DEFAULT_PAGE_SIZE = 10
const SORTABLE_COLUMNS = new Set(['createdAt', 'fullName', 'email', 'role', 'status', 'joinedDate'])

export function useUserManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [recordTypeFilter, setRecordTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const debouncedSearch = useDebouncedValue(search, 400)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    roleFilter,
    centerFilter,
    statusFilter,
    recordTypeFilter,
    pageSize,
    sortBy,
    sortOrder,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(
    () =>
      buildUserListParams({
        page: effectivePage,
        limit: pageSize,
        search: debouncedSearch,
        roleFilter,
        centerFilter,
        statusFilter,
        recordTypeFilter,
        sortBy,
        sortOrder,
      }),
    [
      effectivePage,
      pageSize,
      debouncedSearch,
      roleFilter,
      centerFilter,
      statusFilter,
      recordTypeFilter,
      sortBy,
      sortOrder,
    ],
  )

  const usersQuery = useUsers(listParams)
  const rolesQuery = useUserRolesDropdown()
  const centersQuery = useUserCentersDropdown()
  const moduleConfigQuery = useUserModuleConfig()

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, roleFilter, centerFilter, statusFilter, recordTypeFilter, pageSize, sortBy, sortOrder])

  const users = usersQuery.data?.items ?? []
  const totalItems = usersQuery.data?.total ?? 0
  const totalPages = usersQuery.data?.totalPages ?? 1

  const roleOptions = useMemo(
    () => [
      { value: 'all', label: 'All roles' },
      ...(rolesQuery.data ?? []).filter((opt) => opt.value.toUpperCase() !== 'ALL'),
    ],
    [rolesQuery.data],
  )

  const centerOptions = useMemo(
    () => [
      { value: 'all', label: 'All centers' },
      ...(centersQuery.data ?? []),
    ],
    [centersQuery.data],
  )

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
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }
  }, [page, pageSize, totalItems, totalPages])

  const handleSort = (columnKey) => {
    const apiKey = columnKey === 'joinedAt' ? 'joinedDate' : columnKey
    if (!SORTABLE_COLUMNS.has(apiKey)) return

    if (sortBy === apiKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(apiKey)
      setSortOrder('asc')
    }
  }

  const resetFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setCenterFilter('all')
    setStatusFilter('all')
    setRecordTypeFilter('all')
    setSortBy('createdAt')
    setSortOrder('desc')
    setPage(1)
  }

  return {
    users,
    loading: usersQuery.isLoading,
    fetching: usersQuery.isFetching,
    loadError: usersQuery.error,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    centerFilter,
    setCenterFilter,
    statusFilter,
    setStatusFilter,
    recordTypeFilter,
    setRecordTypeFilter,
    sortBy,
    sortOrder,
    handleSort,
    roleOptions,
    centerOptions,
    filtersLoading: rolesQuery.isLoading || centersQuery.isLoading,
    moduleConfig: moduleConfigQuery.data,
    pagination,
    listParams,
    resetFilters,
    refreshUsers: usersQuery.refetch,
  }
}

export { SORTABLE_COLUMNS }
