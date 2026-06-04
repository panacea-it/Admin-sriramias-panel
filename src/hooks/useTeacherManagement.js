import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { getTeachers } from '../services/teacherService'
import {
  mapTeacherStatusFilterToApi,
  normalizeTeachersListResponse,
} from '../pages/academics/categories/teachers/teacherHelpers'

const DEFAULT_PAGE_SIZE = 10

export function useTeacherManagement() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: pageSize,
        search: debouncedSearch.trim(),
      }

      const apiStatus = mapTeacherStatusFilterToApi(statusFilter)
      if (apiStatus) params.status = apiStatus
      if (subjectFilter !== 'all') params.subject = subjectFilter
      if (centerFilter !== 'all') params.centerId = centerFilter

      const data = await getTeachers(params)
      const normalized = normalizeTeachersListResponse(data, { page, limit: pageSize })

      setTeachers(normalized.items)
      setTotalItems(normalized.total)
      setTotalPages(normalized.totalPages)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to load teachers'))
      setTeachers([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, statusFilter, subjectFilter, centerFilter])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, subjectFilter, centerFilter, pageSize])

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

  const patchTeacherLocally = useCallback((teacherId, patch) => {
    setTeachers((prev) =>
      prev.map((row) => (String(row.id) === String(teacherId) ? { ...row, ...patch } : row)),
    )
  }, [])

  const removeTeacherLocally = useCallback((teacherId) => {
    setTeachers((prev) => prev.filter((row) => String(row.id) !== String(teacherId)))
    setTotalItems((prev) => Math.max(0, prev - 1))
  }, [])

  return {
    teachers,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    subjectFilter,
    setSubjectFilter,
    centerFilter,
    setCenterFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    controlledPagination,
    refreshTeachers: fetchTeachers,
    patchTeacherLocally,
    removeTeacherLocally,
  }
}
