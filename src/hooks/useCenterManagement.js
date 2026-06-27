import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { buildFilterSignature, useEffectivePage } from './useMasterListQuery'
import { useCenters } from './center/useCenters'
import { buildCenterListParams } from '../utils/centerHelpers'

const DEFAULT_PAGE_SIZE = 10

const SORTABLE_COLUMNS = new Set([
  'createdAt',
  'centerName',
  'centerCode',
  'city',
  'status',
])

export function useCenterManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const debouncedSearch = useDebouncedValue(search, 400)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    statusFilter,
    pageSize,
    sortBy,
    sortOrder,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(
    () =>
      buildCenterListParams({
        page: effectivePage,
        limit: pageSize,
        search: debouncedSearch,
        statusFilter,
        sortBy,
        sortOrder,
      }),
    [effectivePage, pageSize, debouncedSearch, statusFilter, sortBy, sortOrder],
  )

  const { data, isLoading, isFetching, error, refetch } = useCenters(listParams)

  const centers = data?.items ?? []
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

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

  const controlledPagination = useMemo(
    () => ({
      ...pagination,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [pagination],
  )

  const handleSort = useCallback((columnKey) => {
    const apiKey = columnKey === 'center' ? 'centerName' : columnKey
    if (!SORTABLE_COLUMNS.has(apiKey)) return

    setSortBy((prev) => {
      if (prev === apiKey) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortOrder('asc')
      return apiKey
    })
  }, [])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, pageSize, sortBy, sortOrder])

  return {
    centers,
    loading: isLoading || isFetching,
    loadError: error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    sortOrder,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    controlledPagination,
    refreshCenters: refetch,
    listParams,
  }
}
