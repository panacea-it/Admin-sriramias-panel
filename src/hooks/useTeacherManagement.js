import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { getTeachers } from '../services/teacherService'
import {
  mapTeacherStatusFilterToApi,
  normalizeTeachersListResponse,
} from '../pages/academics/categories/teachers/teacherHelpers'
import {
  buildFilterSignature,
  createListFetchGuard,
  runGuardedListFetch,
  useEffectivePage,
} from './useMasterListQuery'

const DEFAULT_PAGE_SIZE = 10

export function useTeacherManagement() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
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
    centerFilter,
    pageSize,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const applyPaginated = useCallback((normalized) => {
    setTeachers(normalized.items)
    setTotalItems(normalized.total)
    setTotalPages(normalized.totalPages)
  }, [])

  const fetchTeachers = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = {
        page: effectivePage,
        limit: pageSize,
        search: debouncedSearch.trim(),
      }

      const apiStatus = mapTeacherStatusFilterToApi(statusFilter)
      if (apiStatus) params.status = apiStatus
      if (subjectFilter !== 'all') params.subject = subjectFilter
      if (centerFilter !== 'all') params.centerId = centerFilter

      const sessionKey = `teachers:${JSON.stringify(params)}`

      await runGuardedListFetch({
        fetchGuard,
        sessionKey,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: async () => {
          const data = await getTeachers(params)
          return normalizeTeachersListResponse(data, { page: effectivePage, limit: pageSize })
        },
        applyData: applyPaginated,
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error)
          fetchGuard.toastListError(
            fetchGuard.getListErrorMessage(error, 'Failed to load teachers'),
          )
          if (!hydratedFromSession) {
            setTeachers([])
            setTotalItems(0)
            setTotalPages(1)
          }
        },
      })
    },
    [
      effectivePage,
      pageSize,
      debouncedSearch,
      statusFilter,
      subjectFilter,
      centerFilter,
      fetchGuard,
      applyPaginated,
    ],
  )

  useEffect(() => {
    let ignore = false
    fetchTeachers({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [fetchTeachers])

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

  const patchTeacherLocally = useCallback((teacherId, patch) => {
    setTeachers((prev) =>
      prev.map((row) => (String(row.id) === String(teacherId) ? { ...row, ...patch } : row)),
    )
  }, [])

  const removeTeacherLocally = useCallback((teacherId) => {
    setTeachers((prev) => prev.filter((row) => String(row.id) !== String(teacherId)))
    setTotalItems((prev) => Math.max(0, prev - 1))
  }, [])

  return {
    teachers,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    subjectFilter,
    setSubjectFilter,
    centerFilter,
    setCenterFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    controlledPagination,
    refreshTeachers: () => fetchTeachers({ bypassCache: true }),
    patchTeacherLocally,
    removeTeacherLocally,
  }
}
