import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { getSubjects } from '../services/subjectService'
import {
  mapSubjectStatusFilterToApi,
  normalizeSubjectsListResponse,
} from '../pages/academics/categories/subject/subjectHelpers'

const DEFAULT_PAGE_SIZE = 10

export function useSubjectManagement() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)

  const fetchSubjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: pageSize,
        search: debouncedSearch.trim(),
      }

      const apiStatus = mapSubjectStatusFilterToApi(statusFilter)
      if (apiStatus) params.status = apiStatus

      const data = await getSubjects(params)
      const normalized = normalizeSubjectsListResponse(data, { page, limit: pageSize })

      setSubjects(normalized.items)
      setTotalItems(normalized.total)
      setTotalPages(normalized.totalPages)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to load subjects'))
      setSubjects([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, statusFilter])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, pageSize])

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

  const patchSubjectLocally = useCallback((subjectId, patch) => {
    setSubjects((prev) =>
      prev.map((row) => (String(row.id) === String(subjectId) ? { ...row, ...patch } : row)),
    )
  }, [])

  const removeSubjectLocally = useCallback((subjectId) => {
    setSubjects((prev) => prev.filter((row) => String(row.id) !== String(subjectId)))
    setTotalItems((prev) => Math.max(0, prev - 1))
  }, [])

  return {
    subjects,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    controlledPagination,
    refreshSubjects: fetchSubjects,
    patchSubjectLocally,
    removeSubjectLocally,
  }
}
