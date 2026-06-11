import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage, isRateLimitError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'
import { useDebouncedValue } from './useDebouncedValue'
import { getFacultySubjects } from '../api/facultySubjectsAPI'
import {
  isMongoObjectId,
  mapFacultySubjectStatusFilterToApi,
  normalizeFacultySubjectsListResponse,
} from '../utils/facultySubjectHelpers'
import { loadAcademicsSubjects } from '../utils/academicsSubjectsStorage'
import { syncFacultySubjectsToLocalStorage } from '../utils/facultySubjectSync'

const DEFAULT_PAGE_SIZE = 10
const facultySubjectsListCache = createCachedRequest({ ttlMs: 60_000 })

function loadSyncedLocalSubjects() {
  try {
    return loadAcademicsSubjects().filter((row) => isMongoObjectId(row?.id))
  } catch {
    return []
  }
}

function getInitialListState() {
  const local = loadSyncedLocalSubjects()
  return {
    subjects: local,
    totalItems: local.length,
    totalPages: Math.max(1, Math.ceil(local.length / DEFAULT_PAGE_SIZE) || 1),
  }
}

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

async function fetchFacultySubjectsList(params, { bypassCache = false, signal } = {}) {
  try {
    return await facultySubjectsListCache.fetch(
      params,
      async () => getFacultySubjects(params, { signal }),
      { bypass: bypassCache },
    )
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (isRateLimitError(error)) {
      const stale = facultySubjectsListCache.getCached(params)
      if (stale !== undefined) return stale
    }
    throw error
  }
}

const INITIAL_LIST_STATE = getInitialListState()

export function useFacultySubjectsManagement() {
  const [subjects, setSubjects] = useState(INITIAL_LIST_STATE.subjects)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(INITIAL_LIST_STATE.totalItems)
  const [totalPages, setTotalPages] = useState(INITIAL_LIST_STATE.totalPages)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)
  const [loadError, setLoadError] = useState(null)
  const lastErrorToastAt = useRef(0)
  const loadSeqRef = useRef(0)
  const abortRef = useRef(null)
  const lastRequestKeyRef = useRef('')

  const applyLocalFallback = useCallback(() => {
    const local = loadSyncedLocalSubjects()
    if (!local.length) return false
    setSubjects(local)
    setTotalItems(local.length)
    setTotalPages(Math.max(1, Math.ceil(local.length / pageSize)))
    setLoadError(null)
    return true
  }, [pageSize])

  const loadSubjects = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({ page, pageSize, debouncedSearch, statusFilter })
      const requestKey = JSON.stringify(params)

      if (!bypassCache && requestKey === lastRequestKeyRef.current) {
        const cached = facultySubjectsListCache.getCached(params)
        if (cached !== undefined) {
          const normalized = normalizeFacultySubjectsListResponse(cached, {
            page,
            limit: pageSize,
          })
          setSubjects(normalized.items)
          setTotalItems(normalized.total)
          setTotalPages(normalized.totalPages)
          setLoadError(null)
          setLoading(false)
          return
        }
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const seq = ++loadSeqRef.current
      lastRequestKeyRef.current = requestKey

      setLoading(true)
      setLoadError(null)

      try {
        const data = await fetchFacultySubjectsList(params, {
          bypassCache,
          signal: controller.signal,
        })
        if (ignoreFlag?.() || seq !== loadSeqRef.current || controller.signal.aborted) return

        const normalized = normalizeFacultySubjectsListResponse(data, {
          page,
          limit: pageSize,
        })
        if (!normalized.items.length && normalized.total > 0 && applyLocalFallback()) {
          return
        }
        setSubjects(normalized.items)
        setTotalItems(normalized.total)
        setTotalPages(normalized.totalPages)
        if (normalized.items.length) {
          syncFacultySubjectsToLocalStorage(normalized.items)
        }
        setLoadError(null)
      } catch (error) {
        if (ignoreFlag?.() || seq !== loadSeqRef.current || controller.signal.aborted) return
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return

        if (import.meta.env.DEV) console.error(error)

        const message = getApiErrorMessage(error, 'Failed to load faculty subjects')
        setLoadError(message)

        const now = Date.now()
        if (now - lastErrorToastAt.current > 4000) {
          lastErrorToastAt.current = now
          toast.error(message)
        }

        if (isRateLimitError(error)) {
          applyLocalFallback()
        } else {
          setSubjects([])
          setTotalItems(0)
          setTotalPages(1)
        }
      } finally {
        if (!ignoreFlag?.() && seq === loadSeqRef.current) {
          setLoading(false)
        }
      }
    },
    [page, pageSize, debouncedSearch, statusFilter, applyLocalFallback],
  )

  useEffect(() => {
    let ignore = false
    loadSubjects({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
      abortRef.current?.abort()
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
    lastRequestKeyRef.current = ''
    await loadSubjects({ bypassCache: true })
  }, [loadSubjects])

  const retrySubjects = useCallback(async () => {
    await loadSubjects({ bypassCache: false })
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
    retrySubjects,
    patchSubjectLocally,
    removeSubjectLocally,
  }
}
