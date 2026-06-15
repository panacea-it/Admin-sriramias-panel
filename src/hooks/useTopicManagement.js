import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { getTopics, getTopicsBySubject } from '../services/topicService'
import {
  mapTopicStatusFilterToApi,
  normalizeTopicsListResponse,
} from '../pages/academics/categories/topic/topicHelpers'
import {
  buildFilterSignature,
  createListFetchGuard,
  runGuardedListFetch,
  useEffectivePage,
} from './useMasterListQuery'

const DEFAULT_PAGE_SIZE = 10

export function useTopicManagement() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 400)
  const fetchGuardRef = useRef(null)

  if (!fetchGuardRef.current) {
    fetchGuardRef.current = createListFetchGuard()
  }
  const fetchGuard = fetchGuardRef.current

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    statusFilter,
    subjectFilter,
    pageSize,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const applyPaginated = useCallback((normalized) => {
    setTopics(normalized.items)
    setTotalItems(normalized.total)
    setTotalPages(normalized.totalPages)
  }, [])

  const fetchTopics = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const apiStatus = mapTopicStatusFilterToApi(statusFilter)
      const trimmedSearch = debouncedSearch.trim()
      const useBySubjectEndpoint =
        subjectFilter !== 'all' && !trimmedSearch && !apiStatus

      const sessionKey = JSON.stringify({
        scope: 'topics',
        effectivePage,
        pageSize,
        trimmedSearch,
        apiStatus,
        subjectFilter,
        useBySubjectEndpoint,
      })

      await runGuardedListFetch({
        fetchGuard,
        sessionKey,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: async () => {
          let data

          if (useBySubjectEndpoint) {
            data = await getTopicsBySubject(subjectFilter)
          } else {
            const params = {
              page: effectivePage,
              limit: pageSize,
              search: trimmedSearch,
            }
            if (apiStatus) params.status = apiStatus
            if (subjectFilter !== 'all') params.subject = subjectFilter
            data = await getTopics(params)
          }

          let normalized = normalizeTopicsListResponse(data, {
            page: effectivePage,
            limit: pageSize,
          })

          if (useBySubjectEndpoint) {
            const allItems = normalized.items
            const total = allItems.length
            const computedTotalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
            const safePage = Math.min(Math.max(1, effectivePage), computedTotalPages)
            const start = (safePage - 1) * pageSize
            normalized = {
              items: allItems.slice(start, start + pageSize),
              total,
              totalPages: computedTotalPages,
              page: safePage,
            }
          }

          return normalized
        },
        applyData: applyPaginated,
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error)
          fetchGuard.toastListError(
            fetchGuard.getListErrorMessage(error, 'Failed to load topics'),
          )
          if (!hydratedFromSession) {
            setTopics([])
            setTotalItems(0)
            setTotalPages(1)
          }
        },
      })
    },
    [effectivePage, pageSize, debouncedSearch, statusFilter, subjectFilter, fetchGuard, applyPaginated],
  )

  useEffect(() => {
    let ignore = false
    fetchTopics({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [fetchTopics])

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

  const patchTopicLocally = useCallback((topicId, patch) => {
    setTopics((prev) =>
      prev.map((row) => (String(row.id) === String(topicId) ? { ...row, ...patch } : row)),
    )
  }, [])

  const removeTopicLocally = useCallback((topicId) => {
    setTopics((prev) => prev.filter((row) => String(row.id) !== String(topicId)))
    setTotalItems((prev) => Math.max(0, prev - 1))
  }, [])

  return {
    topics,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    subjectFilter,
    setSubjectFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    controlledPagination,
    refreshTopics: () => fetchTopics({ bypassCache: true }),
    patchTopicLocally,
    removeTopicLocally,
  }
}
