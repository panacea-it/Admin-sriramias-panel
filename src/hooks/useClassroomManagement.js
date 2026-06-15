import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isRateLimitError } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { clearClassroomsListCache, getClassrooms } from '../services/classroomService'
import {
  mapClassroomStatusFilterToApi,
  normalizeClassroomsListResponse,
} from '../utils/classroomApiHelpers'
import {
  buildFilterSignature,
  createListFetchGuard,
  invalidateListSession,
  runGuardedListFetch,
  useEffectivePage,
} from './useMasterListQuery'

const SESSION_SCOPE = 'classrooms'
const DEFAULT_PAGE_SIZE = 10

function buildListParams({ page, pageSize, statusFilter, centerFilter }) {
  const apiStatus = mapClassroomStatusFilterToApi(statusFilter)
  const params = {
    page,
    limit: pageSize,
  }
  if (apiStatus) params.status = apiStatus
  if (centerFilter !== 'all') params.center = centerFilter
  return params
}

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
  const debouncedSearch = useDebouncedValue(search, 400)
  const fetchGuardRef = useRef(null)

  if (!fetchGuardRef.current) {
    fetchGuardRef.current = createListFetchGuard()
  }
  const fetchGuard = fetchGuardRef.current

  const filterSignature = buildFilterSignature([
    statusFilter,
    centerFilter,
    pageSize,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const applyPaginated = useCallback((normalized) => {
    setClassrooms(normalized.items)
    setTotalItems(normalized.total)
    setTotalPages(normalized.totalPages)
  }, [])

  const loadClassrooms = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({
        page: effectivePage,
        pageSize,
        statusFilter,
        centerFilter,
      })

      const sessionKey = `${SESSION_SCOPE}:${JSON.stringify(params)}`

      await runGuardedListFetch({
        fetchGuard,
        sessionKey,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: async () => {
          const data = await getClassrooms(params, { bypassCache })
          return normalizeClassroomsListResponse(data, { page: effectivePage, limit: pageSize })
        },
        applyData: applyPaginated,
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error)
          fetchGuard.toastListError(
            fetchGuard.getListErrorMessage(error, 'Failed to load classrooms'),
          )
          if (!isRateLimitError(error) && !hydratedFromSession) {
            setClassrooms([])
            setTotalItems(0)
            setTotalPages(1)
          }
        },
      })
    },
    [effectivePage, pageSize, statusFilter, centerFilter, fetchGuard, applyPaginated],
  )

  useEffect(() => {
    let ignore = false
    loadClassrooms({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadClassrooms])

  const refreshClassrooms = useCallback(async () => {
    clearClassroomsListCache()
    invalidateListSession(SESSION_SCOPE)
    await loadClassrooms({ bypassCache: true })
  }, [loadClassrooms])

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
    debouncedSearch,
    controlledPagination,
    refreshClassrooms,
  }
}
