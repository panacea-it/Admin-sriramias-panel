import { useCallback, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { useFaculty } from './useFaculty'
import { mapTeacherStatusFilterToApi } from '../pages/academics/categories/teachers/teacherHelpers'
import { buildFilterSignature, useEffectivePage } from './useMasterListQuery'

const DEFAULT_PAGE_SIZE = 10

export function useTeacherManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const debouncedSearch = useDebouncedValue(search, 400)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    statusFilter,
    subjectFilter,
    centerFilter,
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

    const apiStatus = mapTeacherStatusFilterToApi(statusFilter)
    if (apiStatus) params.status = apiStatus
    if (subjectFilter !== 'all') params.subject = subjectFilter
    if (centerFilter !== 'all') params.centerId = centerFilter

    return params
  }, [
    effectivePage,
    pageSize,
    debouncedSearch,
    statusFilter,
    subjectFilter,
    centerFilter,
    sortBy,
    sortOrder,
  ])

  const { data, isLoading, isFetching, isError, error, refetch } = useFaculty(listParams)

  const teachers = data?.items ?? []
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
    const allowed = ['createdAt', 'teacherName', 'teacherId', 'status']
    const apiKey =
      columnKey === 'name'
        ? 'teacherName'
        : columnKey === 'displayId' || columnKey === 'id'
          ? 'teacherId'
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
    teachers,
    loading: isLoading,
    isFetching,
    listError: isError ? error : null,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    subjectFilter,
    setSubjectFilter,
    centerFilter,
    setCenterFilter,
    sortBy,
    sortOrder,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    controlledPagination,
    refreshTeachers: refetch,
    listParams,
  }
}

/** @alias useTeacherManagement */
export const useFacultyManagement = useTeacherManagement

export default useTeacherManagement
