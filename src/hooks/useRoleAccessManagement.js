import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { useRoleAccessList } from './roleAccess/useRoleAccessList'
import { buildRoleListParams } from '../utils/roleAccessHelpers'
import { getApiErrorMessage } from '../utils/apiError'

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SORT = 'createdAt:desc'

export function useRoleAccessManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortPreset, setSortPreset] = useState(DEFAULT_SORT)

  const debouncedSearch = useDebouncedValue(search, 300)

  const listParams = useMemo(
    () =>
      buildRoleListParams({
        page,
        limit: pageSize,
        search: debouncedSearch,
        statusFilter,
        sortPreset,
      }),
    [page, pageSize, debouncedSearch, statusFilter, sortPreset],
  )

  const { data, isLoading, isFetching, error, refetch } = useRoleAccessList(listParams)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, sortPreset, pageSize])

  const roles = data?.items ?? []
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
    }),
    [safePage, pageSize, totalItems, totalPages, startIndex, endIndex],
  )

  const sortState = useMemo(() => {
    const [sortBy, sortOrder] = sortPreset.split(':')
    return { sortBy, sortOrder: sortOrder === 'asc' ? 'asc' : 'desc' }
  }, [sortPreset])

  const handleSort = (columnKey) => {
    const { sortBy, sortOrder } = sortState
    if (sortBy === columnKey) {
      setSortPreset(`${columnKey}:${sortOrder === 'asc' ? 'desc' : 'asc'}`)
      return
    }
    setSortPreset(`${columnKey}:asc`)
  }

  return {
    roles,
    loading: isLoading,
    fetching: isFetching,
    loadError: error ? getApiErrorMessage(error, 'Failed to load roles') : null,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortPreset,
    setSortPreset,
    sortBy: sortState.sortBy,
    sortOrder: sortState.sortOrder,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    refreshRoles: refetch,
  }
}
