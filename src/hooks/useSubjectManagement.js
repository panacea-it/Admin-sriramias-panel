import { useCallback, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { useSubjects } from './useSubjects'
import { mapSubjectStatusFilterToApi } from '../pages/academics/categories/subject/subjectHelpers'
import { buildFilterSignature, useEffectivePage } from './useMasterListQuery'

const DEFAULT_PAGE_SIZE = 10

export function useSubjectManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const debouncedSearch = useDebouncedValue(search, 300)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
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

    const apiStatus = mapSubjectStatusFilterToApi(statusFilter)
    if (apiStatus) params.status = apiStatus

    return params
  }, [effectivePage, pageSize, debouncedSearch, statusFilter, sortBy, sortOrder])

  const { data, isLoading, isFetching, isError, error, refetch } = useSubjects(listParams)

  const subjects = data?.items ?? []
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
    const allowed = ['createdAt', 'subjectName', 'subjectId', 'status']
    const apiKey =
      columnKey === 'name'
        ? 'subjectName'
        : columnKey === 'displayId' || columnKey === 'id'
          ? 'subjectId'
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
    subjects,
    loading: isLoading,
    isFetching,
    listError: isError ? error : null,
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
    refreshSubjects: refetch,
    listParams,
  }
}
