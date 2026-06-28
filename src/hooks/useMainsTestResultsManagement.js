import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { buildFilterSignature, useEffectivePage } from './useMasterListQuery'
import { useMainsTestResultsQuery } from './useMainsManagement'
import {
  filterEvaluatedStudentRows,
  MAINS_RESULTS_STATUS_MAP,
} from '../utils/mainsManagementApiHelpers'
import { toast } from '../utils/toast'
import { getApiErrorMessage } from '../utils/apiError'

const DEFAULT_PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 500

export function useMainsTestResultsManagement(testId) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    pageSize,
    statusFilter,
    testId,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(() => {
    const params = {
      page: effectivePage,
      limit: pageSize,
      status: MAINS_RESULTS_STATUS_MAP[statusFilter] ?? 'all',
    }
    const trimmed = debouncedSearch.trim()
    if (trimmed) params.search = trimmed
    return params
  }, [effectivePage, pageSize, debouncedSearch, statusFilter])

  const { data, isLoading, isFetching, error, refetch } = useMainsTestResultsQuery(
    testId,
    listParams,
  )

  useEffect(() => {
    if (error) {
      console.error('[MainsManagement]', error)
      toast.error(getApiErrorMessage(error, 'Failed to load evaluation results'))
    }
  }, [error])

  const rows = useMemo(() => {
    const baseRows = data?.rows ?? []
    if (statusFilter === 'Evaluated') {
      return filterEvaluatedStudentRows(baseRows)
    }
    return baseRows
  }, [data?.rows, statusFilter])

  const totalItems =
    statusFilter === 'Evaluated' ? rows.length : (data?.total ?? 0)
  const totalPages =
    statusFilter === 'Evaluated'
      ? Math.max(1, Math.ceil(totalItems / pageSize) || 1)
      : (data?.totalPages ?? 1)

  const loading = isLoading || (isFetching && !data)

  const controlledPagination = useMemo(() => {
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
      onPageSizeChange: (size) => {
        setPageSize(Number(size))
        setPage(1)
      },
    }
  }, [page, pageSize, totalItems, totalPages])

  return {
    test: data?.test ?? null,
    summary: data?.summary ?? null,
    rows,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    controlledPagination,
    refetch,
  }
}
