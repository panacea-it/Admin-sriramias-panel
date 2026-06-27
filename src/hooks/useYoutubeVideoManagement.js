import { useCallback, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { buildFilterSignature, useEffectivePage } from './useMasterListQuery'
import { useYoutubeVideosList } from './useYoutubeVideos'
import { mapUiStatusToApi } from '../utils/youtubeApiHelpers'

const DEFAULT_PAGE_SIZE = 10

function toIsoDate(date) {
  if (!date) return undefined
  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) return undefined
  return value.toISOString().slice(0, 10)
}

export function useYoutubeVideoManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const debouncedSearch = useDebouncedValue(search, 300)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    selectedDate?.toISOString?.() ?? '',
    statusFilter,
    priorityFilter,
    pageSize,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(() => {
    const params = {
      page: effectivePage,
      limit: pageSize,
      sortBy: 'rank',
      sortOrder: 'asc',
    }

    const trimmedSearch = debouncedSearch.trim()
    if (trimmedSearch) params.title = trimmedSearch

    if (statusFilter !== 'all') {
      params.status = mapUiStatusToApi(statusFilter)
    }

    if (selectedDate) {
      const iso = toIsoDate(selectedDate)
      if (iso) {
        params.createdFrom = iso
        params.createdTo = iso
      }
    }

    if (priorityFilter !== 'all') {
      const numeric = Number(priorityFilter)
      if (Number.isFinite(numeric) && numeric >= 1) {
        params.priority = numeric
      }
    }

    return params
  }, [effectivePage, pageSize, debouncedSearch, statusFilter, selectedDate, priorityFilter])

  const { data, isLoading, isFetching, isError, error, refetch } = useYoutubeVideosList(listParams)

  const videos = data?.items ?? []

  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0

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
      hasNextPage: data?.hasNextPage ?? (totalPages > 0 && safePage < totalPages),
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
      onPageSizeChange: (nextSize) => {
        setPageSize(nextSize)
        setPage(1)
      },
    }),
    [pagination],
  )

  const refreshVideos = useCallback(() => refetch(), [refetch])

  const hasActiveFilters = Boolean(
    debouncedSearch.trim() ||
      statusFilter !== 'all' ||
      priorityFilter !== 'all' ||
      selectedDate,
  )

  const isListBusy = isLoading || isFetching

  return {
    videos,
    loading: isLoading,
    isFetching,
    isListBusy,
    listError: isError ? error : null,
    search,
    setSearch,
    selectedDate,
    setSelectedDate,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    pagination,
    controlledPagination,
    refreshVideos,
    hasActiveFilters,
    isEmpty:
      !isListBusy &&
      !isError &&
      (data?.count === 0 || data?.total === 0 || videos.length === 0),
  }
}
