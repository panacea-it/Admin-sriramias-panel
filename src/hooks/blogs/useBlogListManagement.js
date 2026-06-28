import { useMemo, useState } from 'react'
import { useDebouncedValue } from '../useDebouncedValue'
import { buildFilterSignature, useEffectivePage } from '../useMasterListQuery'
import { useBlogList } from './useBlogManagement'

const DEFAULT_PAGE_SIZE = 10

export function useBlogListManagement(options = {}) {
  const { enabled = true, languageLookup = {} } = options

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const debouncedSearch = useDebouncedValue(search, 300)

  const filterSignature = buildFilterSignature([
    debouncedSearch.trim(),
    selectedDate?.toISOString?.() ?? '',
    statusFilter,
    pageSize,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(
    () => ({
      page: effectivePage,
      limit: pageSize,
      search: debouncedSearch.trim(),
      status: statusFilter,
      date: selectedDate ? selectedDate.toISOString() : '',
    }),
    [effectivePage, pageSize, debouncedSearch, statusFilter, selectedDate],
  )

  const query = useBlogList(listParams, {
    enabled,
    languageLookup,
  })

  const items = query.data?.items ?? []
  const totalItems = query.data?.total ?? 0
  const totalPages = query.data?.totalPages ?? 0

  const pagination = useMemo(() => {
    const safePage =
      totalPages > 0 ? Math.min(Math.max(1, page), totalPages) : Math.max(1, page)
    const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)

    return {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: query.data?.hasNextPage ?? (totalPages > 0 && safePage < totalPages),
      hasPrevPage: query.data?.hasPrevPage ?? safePage > 1,
    }
  }, [
    page,
    pageSize,
    totalItems,
    totalPages,
    query.data?.hasNextPage,
    query.data?.hasPrevPage,
  ])

  const controlledPagination = useMemo(
    () => ({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
      startIndex: pagination.startIndex,
      endIndex: pagination.endIndex,
      hasNextPage: pagination.hasNextPage,
      hasPrevPage: pagination.hasPrevPage,
      onPageChange: setPage,
      onPageSizeChange: (nextSize) => {
        setPageSize(nextSize)
        setPage(1)
      },
    }),
    [pagination],
  )

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value)
    setPage(1)
  }

  const listLoading = query.isLoading || query.isFetching

  return {
    items,
    listParams,
    search,
    setSearch,
    selectedDate,
    setSelectedDate,
    statusFilter,
    setStatusFilter,
    handleStatusFilterChange,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    controlledPagination,
    listLoading,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
