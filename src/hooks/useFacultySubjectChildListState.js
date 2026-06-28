import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { SEARCH_DEBOUNCE_MS, DEFAULT_PAGE_SIZE } from '../modules/academics/facultySubjects/constants/facultySubject.constants'

/**
 * Shared list/filter/pagination state for faculty subject child tabs.
 */
export function useFacultySubjectChildListState({
  facultySubjectId,
  folderId,
  defaultPageSize = DEFAULT_PAGE_SIZE,
} = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, pageSize, folderId, facultySubjectId])

  const baseFilters = useMemo(
    () => ({
      facultySubjectId: facultySubjectId || undefined,
      folderId: folderId || undefined,
      search: debouncedSearch.trim() || undefined,
      page,
      limit: pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    [facultySubjectId, folderId, debouncedSearch, page, pageSize],
  )

  const controlledPagination = useMemo(
    () => ({
      page,
      pageSize,
      setPage,
      setPageSize,
    }),
    [page, pageSize],
  )

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    debouncedSearch,
    baseFilters,
    controlledPagination,
  }
}

export function buildControlledPagination({ page, pageSize, setPage, setPageSize, totalItems, totalPages }) {
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
    setPage,
    setPageSize,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  }
}
