import { useCallback, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { useTopics } from './useTopics'
import { mapTopicStatusFilterToApi } from '../pages/academics/categories/topic/topicHelpers'
import { buildFilterSignature, useEffectivePage } from './useMasterListQuery'

const DEFAULT_PAGE_SIZE = 10

export function useTopicManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const debouncedSearch = useDebouncedValue(search, 300)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    statusFilter,
    subjectFilter,
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

    const apiStatus = mapTopicStatusFilterToApi(statusFilter)
    if (apiStatus) params.status = apiStatus

    if (subjectFilter !== 'all') params.subject = subjectFilter

    return params
  }, [effectivePage, pageSize, debouncedSearch, statusFilter, subjectFilter, sortBy, sortOrder])

  const { data, isLoading, isFetching, isError, error, refetch } = useTopics(listParams)

  const topics = data?.items ?? []
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
    const allowed = ['createdAt', 'topicName', 'topicId', 'status']
    const apiKey =
      columnKey === 'name'
        ? 'topicName'
        : columnKey === 'displayId' || columnKey === 'id'
          ? 'topicId'
          : columnKey

    if (!allowed.includes(apiKey)) return

    setSortBy((prev) => {
      if (prev === apiKey) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortOrder('asc')
      return apiKey
    })
  }, [])

  return {
    topics,
    loading: isLoading,
    isFetching,
    listError: isError ? error : null,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    subjectFilter,
    setSubjectFilter,
    sortBy,
    sortOrder,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    controlledPagination,
    refreshTopics: refetch,
    listParams,
  }
}
