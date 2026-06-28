import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { buildFilterSignature, useEffectivePage } from './useMasterListQuery'
import { useMainsDashboard, useMainsFacultySubjects } from './useMainsManagement'
import { toast } from '../utils/toast'
import { getApiErrorMessage } from '../utils/apiError'

const PROGRESS_LIMIT = 5
const DEFAULT_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 500

export function useMainsDashboardManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('lastUpdated')
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  const filterSignature = buildFilterSignature([debouncedSearch, pageSize, sort])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(() => {
    const params = {
      page: effectivePage,
      limit: pageSize,
      sort,
    }
    const trimmed = debouncedSearch.trim()
    if (trimmed) params.search = trimmed
    return params
  }, [effectivePage, pageSize, debouncedSearch, sort])

  const {
    data: dashboardCards = [],
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useMainsDashboard(PROGRESS_LIMIT)

  const {
    data: facultyData,
    isLoading: facultySubjectsLoading,
    isFetching: facultySubjectsFetching,
    error: facultyError,
    refetch: refetchFacultySubjects,
  } = useMainsFacultySubjects(listParams)

  useEffect(() => {
    if (dashboardError) {
      console.error('[MainsManagement]', dashboardError)
      toast.error(getApiErrorMessage(dashboardError, 'Failed to load evaluation progress'))
    }
  }, [dashboardError])

  useEffect(() => {
    if (facultyError) {
      console.error('[MainsManagement]', facultyError)
      toast.error(getApiErrorMessage(facultyError, 'Failed to load faculty subjects'))
    }
  }, [facultyError])

  const facultyRows = facultyData?.items ?? []
  const totalItems = facultyData?.total ?? 0
  const totalPages = facultyData?.totalPages ?? 1

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
    latestEvaluations: dashboardCards,
    dashboardLoading,
    facultyRows,
    facultySubjectsLoading: facultySubjectsLoading || (facultySubjectsFetching && !facultyData),
    search,
    setSearch,
    sort,
    setSort,
    controlledPagination,
    refetchDashboard,
    refetchFacultySubjects,
  }
}
