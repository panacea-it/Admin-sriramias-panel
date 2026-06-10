import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage, isRateLimitError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'
import { useDebouncedValue } from './useDebouncedValue'
import { getFacultySubjects } from '../api/facultySubjectsAPI'
import {
  mapFacultySubjectStatusFilterToApi,
  normalizeFacultySubjectsListResponse,
} from '../utils/facultySubjectHelpers'
import { syncFacultySubjectsToLocalStorage } from '../utils/facultySubjectSync'

const DEFAULT_PAGE_SIZE = 10
const facultySubjectsListCache = createCachedRequest({ ttlMs: 60_000 })

function buildListParams({ page, pageSize, debouncedSearch, statusFilter }) {
  const params = { page, limit: pageSize }
  const trimmedSearch = debouncedSearch.trim()
  if (trimmedSearch) params.search = trimmedSearch
  const apiStatus = mapFacultySubjectStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus
  return params
}

export function clearFacultySubjectsListCache() {
  facultySubjectsListCache.clear()
}

async function fetchFacultySubjectsList(params, { bypassCache = false } = {}) {
  return facultySubjectsListCache.fetch(
    params,
    async () => getFacultySubjects(params),
    { bypass: bypassCache },
  )
}

export function useFacultySubjectsManagement() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)
  const [loadError, setLoadError] = useState(null)
  const lastErrorToastAt = useRef(0)

  const loadSubjects = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({ page, pageSize, debouncedSearch, statusFilter })
      setLoading(true)
      setLoadError(null)

      try {
        const data = await fetchFacultySubjectsList(params, { bypassCache })
        if (ignoreFlag?.()) return

        const normalized = normalizeFacultySubjectsListResponse(data, {
          page,
          limit: pageSize,
        })
        setSubjects(normalized.items)
        setTotalItems(normalized.total)
        setTotalPages(normalized.totalPages)
        syncFacultySubjectsToLocalStorage(normalized.items)
        setLoadError(null)
      } catch (error) {
        if (ignoreFlag?.()) return
        if (import.meta.env.DEV) console.error(error)

        const message = getApiErrorMessage(error, 'Failed to load faculty subjects')
        setLoadError(message)

        const now = Date.now()
        if (now - lastErrorToastAt.current > 4000) {
          lastErrorToastAt.current = now
          toast.error(message)
        }

        if (!isRateLimitError(error)) {
          setSubjects([])
          setTotalItems(0)
          setTotalPages(1)
        }
      } finally {
        if (!ignoreFlag?.()) {
          setLoading(false)
        }
      }
    },
    [page, pageSize, debouncedSearch, statusFilter],
  )

  useEffect(() => {
    let ignore = false
    loadSubjects({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadSubjects])

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

  const refreshSubjects = useCallback(async () => {
    clearFacultySubjectsListCache()
    await loadSubjects({ bypassCache: true })
  }, [loadSubjects])

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
    loadError,
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
    refreshSubjects,
    patchSubjectLocally,
    removeSubjectLocally,
  }
}
