import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isRateLimitError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'
import { getFacultySubjects } from '../api/facultySubjectsAPI'
import {
  isMongoObjectId,
  normalizeFacultySubjectsListResponse,
} from '../utils/facultySubjectHelpers'
import { loadAcademicsSubjects } from '../utils/academicsSubjectsStorage'
import { syncFacultySubjectsToLocalStorage } from '../utils/facultySubjectSync'
import {
  buildFilterSignature,
  createListFetchGuard,
  invalidateListSession,
  runGuardedListFetch,
  useEffectivePage,
} from './useMasterListQuery'

const DEFAULT_PAGE_SIZE = 10
const LIST_FETCH_LIMIT = 100
const SESSION_SCOPE = 'faculty-subjects'
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

function buildListParams() {
  return { page: 1, limit: LIST_FETCH_LIMIT }
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
  const [loadError, setLoadError] = useState(null)
  const fetchGuardRef = useRef(null)

  if (!fetchGuardRef.current) {
    fetchGuardRef.current = createListFetchGuard()
  }
  const fetchGuard = fetchGuardRef.current

  const filterSignature = buildFilterSignature([pageSize])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const applyLocalFallback = useCallback(() => {
    const local = loadSyncedLocalSubjects()
    if (!local.length) return false
    setSubjects(local)
    setTotalItems(local.length)
    setTotalPages(Math.max(1, Math.ceil(local.length / pageSize)))
    setLoadError(null)
    return true
  }, [pageSize])

  const applyPaginated = useCallback(
    (data) => {
      const normalized = normalizeFacultySubjectsListResponse(data, {
        page: effectivePage,
        limit: pageSize,
      })
      if (!normalized.items.length && normalized.total > 0 && applyLocalFallback()) {
        return normalized
      }
      setSubjects(normalized.items)
      setTotalItems(normalized.total)
      setTotalPages(normalized.totalPages)
      if (normalized.items.length) {
        syncFacultySubjectsToLocalStorage(normalized.items)
      }
      setLoadError(null)
      return normalized
    },
    [effectivePage, pageSize, applyLocalFallback],
  )

  const loadSubjects = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams()
      const sessionKey = `${SESSION_SCOPE}:${JSON.stringify(params)}`

      await runGuardedListFetch({
        fetchGuard,
        sessionKey,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: ({ signal }) => fetchFacultySubjectsList(params, { bypassCache, signal }),
        applyData: applyPaginated,
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error)
          const message = fetchGuard.getListErrorMessage(error, 'Failed to load faculty subjects')
          setLoadError(message)
          fetchGuard.toastListError(message)

          if (isRateLimitError(error)) {
            applyLocalFallback()
          } else if (!hydratedFromSession) {
            setSubjects([])
            setTotalItems(0)
            setTotalPages(1)
          }
        },
      })
    },
    [fetchGuard, applyPaginated, applyLocalFallback],
  )

  useEffect(() => {
    let ignore = false
    loadSubjects({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadSubjects])

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
    invalidateListSession(SESSION_SCOPE)
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
