import { useCallback, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { useClassrooms } from './useClassrooms'
import { mapClassroomStatusFilterToApi } from '../utils/classroomApiHelpers'
import { buildFilterSignature, useEffectivePage } from './useMasterListQuery'

const DEFAULT_PAGE_SIZE = 10

export function useClassroomManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const debouncedSearch = useDebouncedValue(search, 300)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    statusFilter,
    centerFilter,
    cityFilter,
    pageSize,
    sortBy,
    sortOrder,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(() => {
    /** @type {import('../types/classroom.types').ClassroomListParams} */
    const params = {
      page: effectivePage,
      limit: pageSize,
      sortBy,
      sortOrder,
    }

    const trimmedSearch = debouncedSearch.trim()
    if (trimmedSearch) params.search = trimmedSearch

    const apiStatus = mapClassroomStatusFilterToApi(statusFilter)
    if (apiStatus) params.status = apiStatus

    if (centerFilter !== 'all') params.center = centerFilter
    if (cityFilter !== 'all') params.city = cityFilter

    return params
  }, [
    effectivePage,
    pageSize,
    debouncedSearch,
    statusFilter,
    centerFilter,
    cityFilter,
    sortBy,
    sortOrder,
  ])

  const { data, isLoading, isFetching, isError, error, refetch } = useClassrooms(listParams)

  const classrooms = data?.items ?? []
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
    const allowed = [
      'createdAt',
      'classroomName',
      'classroomCode',
      'capacity',
      'status',
      'centerName',
      'cityAddress',
    ]
    const apiKey =
      columnKey === 'name'
        ? 'classroomName'
        : columnKey === 'code'
          ? 'classroomCode'
          : columnKey === 'placeName'
            ? 'cityAddress'
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
    classrooms,
    loading: isLoading,
    isFetching,
    listError: isError ? error : null,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    cityFilter,
    setCityFilter,
    sortBy,
    sortOrder,
    handleSort,
    controlledPagination,
    refreshClassrooms: refetch,
    listParams,
  }
}
