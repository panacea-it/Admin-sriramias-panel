import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage, isRateLimitError } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { getFacultySubjects } from '../api/facultySubjectsAPI'
import {
  mapFacultySubjectStatusFilterToApi,
  normalizeFacultySubjectsListResponse,
} from '../utils/facultySubjectHelpers'
import { syncFacultySubjectsToLocalStorage } from '../utils/facultySubjectSync'

const DEFAULT_PAGE_SIZE = 10
const LIST_CACHE_TTL_MS = 2500

let listResponseCache = { key: '', payload: null, at: 0 }
let rateLimitToastAt = 0

function buildListParams({ page, pageSize, debouncedSearch, statusFilter }) {
  const params = { page, limit: pageSize }
  const trimmedSearch = debouncedSearch.trim()
  if (trimmedSearch) params.search = trimmedSearch
  const apiStatus = mapFacultySubjectStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus
  return params
}

function buildListCacheKey(params) {
  return JSON.stringify(params)
}

async function fetchFacultySubjectsList(params, { signal, bypassCache = false } = {}) {
  const cacheKey = buildListCacheKey(params)
  const now = Date.now()
  if (
    !bypassCache &&
    listResponseCache.key === cacheKey &&
    listResponseCache.payload &&
    now - listResponseCache.at < LIST_CACHE_TTL_MS
  ) {
    return listResponseCache.payload
  }

  const data = await getFacultySubjects(params, { signal })
  listResponseCache = { key: cacheKey, payload: data, at: now }
  return data
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
  const [refreshNonce, setRefreshNonce] = useState(0)
  const debouncedSearch = useDebouncedValue(search, 500)
  const filtersKey = `${debouncedSearch}|${statusFilter}|${pageSize}`
  const prevFiltersKeyRef = useRef(filtersKey)
  const abortRef = useRef(null)
  const requestSeqRef = useRef(0)

  useEffect(() => {
    if (prevFiltersKeyRef.current !== filtersKey) {
      prevFiltersKeyRef.current = filtersKey
      if (page !== 1) {
        setPage(1)
        return undefined
      }
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestSeq = ++requestSeqRef.current
    let cancelled = false

    const run = async () => {
      const params = buildListParams({ page, pageSize, debouncedSearch, statusFilter })
      setLoading(true)

      try {
        const data = await fetchFacultySubjectsList(params, {
          signal: controller.signal,
          bypassCache: refreshNonce > 0,
        })
        if (cancelled || requestSeq !== requestSeqRef.current) return

        const normalized = normalizeFacultySubjectsListResponse(data, { page, limit: pageSize })
        setSubjects(normalized.items)
        setTotalItems(normalized.total)
        setTotalPages(normalized.totalPages)
        syncFacultySubjectsToLocalStorage(normalized.items)
      } catch (error) {
        if (cancelled || requestSeq !== requestSeqRef.current) return
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return

        if (import.meta.env.DEV) console.error(error)

        if (isRateLimitError(error)) {
          const now = Date.now()
          if (now - rateLimitToastAt > 4000) {
            rateLimitToastAt = now
            toast.error(getApiErrorMessage(error, 'Too many requests. Please wait and try again.'))
          }
          return
        }

        toast.error(getApiErrorMessage(error, 'Failed to load faculty subjects'))
        setSubjects([])
        setTotalItems(0)
        setTotalPages(1)
      } finally {
        if (!cancelled && requestSeq === requestSeqRef.current) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [page, pageSize, debouncedSearch, statusFilter, filtersKey, refreshNonce])

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

  const refreshSubjects = useCallback(() => {
    listResponseCache = { key: '', payload: null, at: 0 }
    setRefreshNonce((value) => value + 1)
  }, [])

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
    refreshSubjects,
    patchSubjectLocally,
    removeSubjectLocally,
  }
}
