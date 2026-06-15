import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { getSubjects } from '../services/subjectService'
import {
  mapSubjectStatusFilterToApi,
  normalizeSubjectsListResponse,
} from '../pages/academics/categories/subject/subjectHelpers'
import {
  buildFilterSignature,
  createListFetchGuard,
  getListSessionCache,
  runGuardedListFetch,
  useEffectivePage,
} from './useMasterListQuery'

const SESSION_SCOPE = 'category-subjects'
const DEFAULT_PAGE_SIZE = 10

function buildSessionKey(params) {
  return `${SESSION_SCOPE}:${JSON.stringify(params)}`
}

function getInitialPaginatedState() {
  const params = { page: 1, limit: DEFAULT_PAGE_SIZE, search: '', status: undefined }
  const cached = getListSessionCache(buildSessionKey(params))
  return {
    items: cached?.items ?? [],
    totalItems: cached?.total ?? 0,
    totalPages: cached?.totalPages ?? 1,
    loading: cached == null,
  }
}

export function useSubjectManagement() {
  const initial = useMemo(() => getInitialPaginatedState(), [])
  const [subjects, setSubjects] = useState(initial.items)
  const [loading, setLoading] = useState(initial.loading)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(initial.totalItems)
  const [totalPages, setTotalPages] = useState(initial.totalPages)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 400)
  const fetchGuardRef = useRef(null)

  if (!fetchGuardRef.current) {
    fetchGuardRef.current = createListFetchGuard()
  }
  const fetchGuard = fetchGuardRef.current

  const filterSignature = buildFilterSignature([debouncedSearch, statusFilter, pageSize])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const applyPaginated = useCallback((normalized) => {
    setSubjects(normalized.items)
    setTotalItems(normalized.total)
    setTotalPages(normalized.totalPages)
  }, [])

  const fetchSubjects = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = {
        page: effectivePage,
        limit: pageSize,
        search: debouncedSearch.trim(),
      }

      const apiStatus = mapSubjectStatusFilterToApi(statusFilter)
      if (apiStatus) params.status = apiStatus

      const sessionKey = buildSessionKey(params)

      await runGuardedListFetch({
        fetchGuard,
        sessionKey,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: async () => {
          const data = await getSubjects(params)
          return normalizeSubjectsListResponse(data, { page: effectivePage, limit: pageSize })
        },
        applyData: applyPaginated,
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error)
          fetchGuard.toastListError(
            fetchGuard.getListErrorMessage(error, 'Failed to load subjects'),
          )
          if (!hydratedFromSession) {
            setSubjects([])
            setTotalItems(0)
            setTotalPages(1)
          }
        },
      })
    },
    [effectivePage, pageSize, debouncedSearch, statusFilter, fetchGuard, applyPaginated],
  )

  useEffect(() => {
    let ignore = false
    fetchSubjects({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [fetchSubjects])

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
    refreshSubjects: () => fetchSubjects({ bypassCache: true }),
    patchSubjectLocally,
    removeSubjectLocally,
  }
}
