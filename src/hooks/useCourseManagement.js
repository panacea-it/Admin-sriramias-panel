import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isRateLimitError } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { getCourses } from '../services/courseService'
import {
  buildCourseListParams,
  normalizeCoursesListResponse,
} from '../utils/courseApiHelpers'
import {
  buildFilterSignature,
  createListFetchGuard,
  invalidateListSession,
  runGuardedListFetch,
  useEffectivePage,
  MASTER_LIST_RATE_LIMIT_MESSAGE,
} from './useMasterListQuery'

const SESSION_SCOPE = 'courses'
const DEFAULT_PAGE_SIZE = 10

export function useCourseManagement() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 400)
  const fetchGuardRef = useRef(null)

  if (!fetchGuardRef.current) {
    fetchGuardRef.current = createListFetchGuard()
  }
  const fetchGuard = fetchGuardRef.current

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    statusFilter,
    centerFilter,
    programFilter,
    pageSize,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const applyPaginated = useCallback((normalized) => {
    setCourses(normalized.items)
    setTotalItems(normalized.total)
    setTotalPages(normalized.totalPages)
    setListError(null)
  }, [])

  const loadCourses = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildCourseListParams({
        page: effectivePage,
        limit: pageSize,
        search: debouncedSearch,
        statusFilter,
        centerFilter,
        programFilter,
      })

      const sessionKey = `${SESSION_SCOPE}:${JSON.stringify(params)}`

      await runGuardedListFetch({
        fetchGuard,
        sessionKey,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: async () => {
          const data = await getCourses(params)
          return normalizeCoursesListResponse(data, {
            page: effectivePage,
            limit: pageSize,
          })
        },
        applyData: applyPaginated,
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error)
          const message = isRateLimitError(error)
            ? MASTER_LIST_RATE_LIMIT_MESSAGE
            : fetchGuard.getListErrorMessage(error, 'Failed to load courses')

          if (isRateLimitError(error)) {
            fetchGuard.toastListError(message)
            return
          }

          setListError(message)
          fetchGuard.toastListError(message)

          if (!hydratedFromSession) {
            setCourses([])
            setTotalItems(0)
            setTotalPages(1)
          }
        },
        errorFallback: 'Failed to load courses',
      })
    },
    [
      effectivePage,
      pageSize,
      debouncedSearch,
      statusFilter,
      centerFilter,
      programFilter,
      fetchGuard,
      applyPaginated,
    ],
  )

  useEffect(() => {
    let ignore = false
    loadCourses({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadCourses])

  useEffect(() => {
    setProgramFilter('all')
  }, [centerFilter])

  const refreshCourses = useCallback(async () => {
    invalidateListSession(SESSION_SCOPE)
    setListError(null)
    await loadCourses({ bypassCache: true })
  }, [loadCourses])

  const patchCourseLocally = useCallback((courseId, patch) => {
    setCourses((prev) =>
      prev.map((row) =>
        String(row.id) === String(courseId) ? { ...row, ...patch } : row,
      ),
    )
  }, [])

  const removeCourseLocally = useCallback((courseId) => {
    setCourses((prev) => prev.filter((row) => String(row.id) !== String(courseId)))
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
    courses,
    totalCourses: totalItems,
    loading,
    listError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    programFilter,
    setProgramFilter,
    debouncedSearch,
    controlledPagination,
    refreshCourses,
    patchCourseLocally,
    removeCourseLocally,
  }
}

/** @alias useCourseManagement */
export const useCourses = useCourseManagement
