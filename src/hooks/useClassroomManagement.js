import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '../utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { getClassrooms } from '../services/classroomService'
import {
  mapClassroomStatusFilterToApi,
  normalizeClassroomsListResponse,
} from '../utils/classroomApiHelpers'

const DEFAULT_PAGE_SIZE = 10

export function useClassroomManagement() {
  const [classrooms, setClassrooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)

  const fetchClassrooms = useCallback(async () => {
    setLoading(true)
    try {
      const apiStatus = mapClassroomStatusFilterToApi(statusFilter)
      const params = {
        page,
        limit: pageSize,
        search: debouncedSearch.trim(),
      }
      if (apiStatus) params.status = apiStatus
      if (centerFilter !== 'all') params.center = centerFilter

      const data = await getClassrooms(params)
      const normalized = normalizeClassroomsListResponse(data, { page, limit: pageSize })

      setClassrooms(normalized.items)
      setTotalItems(normalized.total)
      setTotalPages(normalized.totalPages)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to load classrooms'))
      setClassrooms([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, statusFilter, centerFilter])

  useEffect(() => {
    fetchClassrooms()
  }, [fetchClassrooms])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, centerFilter, pageSize])

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

  return {
    classrooms,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    controlledPagination,
    refreshClassrooms: fetchClassrooms,
  }
}
