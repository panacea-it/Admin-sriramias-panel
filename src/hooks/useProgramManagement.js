import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isRateLimitError } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { clearProgramsListCache, getPrograms } from '../services/programService'
import {
  mapProgramStatusFilterToApi,
  normalizeProgramsListResponse,
} from '../utils/programHelpers'
import {
  buildFilterSignature,
  createListFetchGuard,
  invalidateListSession,
  runGuardedListFetch,
  useEffectivePage,
  MASTER_LIST_RATE_LIMIT_MESSAGE,
} from './useMasterListQuery'

const SESSION_SCOPE = 'programs'
const DEFAULT_PAGE_SIZE = 10

function buildListParams({ page, pageSize, debouncedSearch, statusFilter, centreFilter }) {
  const params = {
    page,
    limit: pageSize,
    search: debouncedSearch.trim(),
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }

  const apiStatus = mapProgramStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus
  if (centreFilter !== 'all') params.center = centreFilter

  return params
}

export function useProgramManagement() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [centreFilter, setCentreFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 400)
  const fetchGuardRef = useRef(null)

  if (!fetchGuardRef.current) {
    fetchGuardRef.current = createListFetchGuard()
  }
  const fetchGuard = fetchGuardRef.current

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    statusFilter,
    centreFilter,
    pageSize,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const applyPaginated = useCallback((normalized) => {
    setPrograms(normalized.items)
    setTotalItems(normalized.total)
    setTotalPages(normalized.totalPages)
    setListError(null)
  }, [])

  const loadPrograms = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({
        page: effectivePage,
        pageSize,
        debouncedSearch,
        statusFilter,
        centreFilter,
      })

      const sessionKey = `${SESSION_SCOPE}:${JSON.stringify(params)}`

      await runGuardedListFetch({
        fetchGuard,
        sessionKey,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: async () => {
          const data = await getPrograms(params, { bypassCache })
          return normalizeProgramsListResponse(data, {
            page: effectivePage,
            limit: pageSize,
          })
        },
        applyData: applyPaginated,
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) {
            console.error(error)
          }
          const message = isRateLimitError(error)
            ? MASTER_LIST_RATE_LIMIT_MESSAGE
            : fetchGuard.getListErrorMessage(error, 'Failed to load programs')

          if (isRateLimitError(error)) {
            fetchGuard.toastListError(message)
            return
          }

          setListError(message)
          fetchGuard.toastListError(message)

          if (!hydratedFromSession) {
            setPrograms([])
            setTotalItems(0)
            setTotalPages(1)
          }
        },
        errorFallback: 'Failed to load programs',
      })
    },
    [
      effectivePage,
      pageSize,
      debouncedSearch,
      statusFilter,
      centreFilter,
      fetchGuard,
      applyPaginated,
    ],
  )

  useEffect(() => {
    let ignore = false
    loadPrograms({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadPrograms])

  const refreshPrograms = useCallback(async () => {
    clearProgramsListCache()
    invalidateListSession(SESSION_SCOPE)
    setListError(null)
    await loadPrograms({ bypassCache: true })
  }, [loadPrograms])

  const patchProgramLocally = useCallback((programId, patch) => {
    setPrograms((prev) =>
      prev.map((row) =>
        String(row.id) === String(programId) ? { ...row, ...patch } : row,
      ),
    )
  }, [])

  const removeProgramLocally = useCallback((programId) => {
    setPrograms((prev) => prev.filter((row) => String(row.id) !== String(programId)))
    setTotalItems((prev) => Math.max(0, prev - 1))
  }, [])

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
    programs,
    totalPrograms: totalItems,
    loading,
    listError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centreFilter,
    setCentreFilter,
    debouncedSearch,
    controlledPagination,
    refreshPrograms,
    patchProgramLocally,
    removeProgramLocally,
  }
}
