import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../../contexts/AuthContext'
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue'
import { buildFilterSignature, useEffectivePage } from '../../../../hooks/useMasterListQuery'
import { mapFacultySubjectStatusFilterToApi } from '../../../../utils/facultySubjectHelpers'
import { syncFacultySubjectsToLocalStorage } from '../../../../utils/facultySubjectSync'
import { canUseLiveApi } from '../../../../utils/authStorage'
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../constants/facultySubject.constants'
import { useFacultySubjects } from './useFacultySubjects'

export function useFacultySubjectManagement() {
  const { isAuthenticated } = useAuth()
  const liveApiReady = isAuthenticated && canUseLiveApi()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    statusFilter,
    categoryFilter,
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

    const apiStatus = mapFacultySubjectStatusFilterToApi(statusFilter)
    if (apiStatus) params.status = apiStatus

    if (categoryFilter !== 'all') params.category = categoryFilter

    return params
  }, [effectivePage, pageSize, debouncedSearch, statusFilter, categoryFilter, sortBy, sortOrder])

  const { data, isLoading, isFetching, isError, error, refetch } = useFacultySubjects(listParams, {
    enabled: liveApiReady,
  })

  const authBlockedError = useMemo(() => {
    if (liveApiReady) return null
    if (!isAuthenticated) {
      return Object.assign(new Error('Please log in to view faculty subjects.'), { status: 401 })
    }
    return Object.assign(
      new Error(
        'Faculty Subjects requires a live Super Admin login. Demo or offline accounts cannot load API data.',
      ),
      { status: 401 },
    )
  }, [isAuthenticated, liveApiReady])

  const rawSubjects = data?.items ?? []
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  useEffect(() => {
    if (rawSubjects.length) {
      syncFacultySubjectsToLocalStorage(rawSubjects)
    }
  }, [rawSubjects])

  const subjects = useMemo(() => {
    if (teacherFilter === 'all') return rawSubjects
    return rawSubjects.filter((row) => row.teacher === teacherFilter)
  }, [rawSubjects, teacherFilter])

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

  const hasActiveFilters =
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    teacherFilter !== 'all' ||
    Boolean(search.trim())

  const handleSort = useCallback((columnKey) => {
    const allowed = ['createdAt', 'subjectName', 'facultySubjectId', 'status', 'id', 'displayId']
    const apiKey =
      columnKey === 'id' || columnKey === 'displayId'
        ? 'facultySubjectId'
        : columnKey

    if (!allowed.includes(columnKey) && !allowed.includes(apiKey)) return

    setSortBy((prev) => {
      if (prev === apiKey) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortOrder('asc')
      return apiKey
    })
  }, [])

  const resetFilters = useCallback(() => {
    setSearch('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setTeacherFilter('all')
  }, [])

  return {
    subjects,
    rawSubjects,
    loading: liveApiReady ? isLoading : false,
    isFetching: liveApiReady ? isFetching : false,
    listError: authBlockedError || (isError ? error : null),
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    teacherFilter,
    setTeacherFilter,
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
    hasActiveFilters,
    resetFilters,
    totalItems,
    totalPages,
  }
}
