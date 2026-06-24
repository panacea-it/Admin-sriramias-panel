import { useCallback, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { useCurrentAffairs } from './useCurrentAffairs'
import {
  mapUiCategoryToApi,
  mapUiStatusFilterToApi,
} from '../utils/currentAffairsApiHelpers'
import { buildFilterSignature, useEffectivePage } from './useMasterListQuery'

const DEFAULT_PAGE_SIZE = 10

export function useCurrentAffairsManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const debouncedSearch = useDebouncedValue(search, 300)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    categoryFilter,
    yearFilter,
    monthFilter,
    statusFilter,
    pageSize,
    sortBy,
    sortOrder,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(() => {
    const params = {
      page: effectivePage,
      limit: pageSize,
      sortBy,
      sortOrder,
    }

    const trimmedSearch = debouncedSearch.trim()
    if (trimmedSearch) params.search = trimmedSearch

    if (categoryFilter && categoryFilter !== 'all') {
      params.category = mapUiCategoryToApi(categoryFilter)
    }

    if (yearFilter && yearFilter !== 'all') {
      params.year = parseInt(String(yearFilter), 10)
    }

    if (monthFilter && monthFilter !== 'all') {
      params.month = monthFilter
    }

    const apiStatus = mapUiStatusFilterToApi(statusFilter)
    if (apiStatus !== undefined) {
      params.status = apiStatus
    }

    return params
  }, [
    effectivePage,
    pageSize,
    debouncedSearch,
    categoryFilter,
    yearFilter,
    monthFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ])

  const { data, isLoading, isFetching, isError, error, refetch } =
    useCurrentAffairs(listParams)

  const items = data?.items ?? []
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
      hasNextPage: data?.hasNextPage ?? safePage < totalPages,
      hasPrevPage: data?.hasPrevPage ?? safePage > 1,
    }
  }, [page, pageSize, totalItems, totalPages, data?.hasNextPage, data?.hasPrevPage])

  const controlledPagination = useMemo(
    () => ({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
      startIndex: pagination.startIndex,
      endIndex: pagination.endIndex,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [pagination],
  )

  const handleSort = useCallback((columnKey) => {
    const allowed = ['createdAt', 'title', 'year', 'month', 'status', 'category']
    const apiKey = columnKey === 'name' ? 'title' : columnKey

    if (!allowed.includes(apiKey)) return

    setSortBy((prev) => {
      if (prev === apiKey) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortOrder('desc')
      return apiKey
    })
  }, [])

  return {
    items,
    loading: isLoading,
    isFetching,
    listError: isError ? error : null,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
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
    refreshItems: refetch,
    listParams,
  }
}
