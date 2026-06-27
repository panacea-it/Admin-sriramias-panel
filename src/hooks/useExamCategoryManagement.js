import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isRateLimitError } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import {
  clearExamCategoriesListCache,
  getExamCategories,
} from '../services/examCategoryService'
import {
  mapExamCategoryStatusFilterToApi,
  normalizeExamCategoriesListResponse,
} from '../utils/examCategoryApiHelpers'
import {
  buildFilterSignature,
  createListFetchGuard,
  invalidateListSession,
  runGuardedListFetch,
  useEffectivePage,
  MASTER_LIST_RATE_LIMIT_MESSAGE,
} from './useMasterListQuery'

const SESSION_SCOPE = 'exam-categories'
const DEFAULT_PAGE_SIZE = 10

function buildListParams({
  page,
  pageSize,
  debouncedSearch,
  statusFilter,
  centerFilter,
  programFilter,
  sortBy,
  sortOrder,
}) {
  const params = {
    page,
    limit: pageSize,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc',
  }

  const trimmedSearch = debouncedSearch.trim()
  if (trimmedSearch) params.search = trimmedSearch

  const apiStatus = mapExamCategoryStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus
  if (centerFilter !== 'all') params.center = centerFilter
  if (programFilter !== 'all') params.program = programFilter

  return params
}

export function useExamCategoryManagement() {
  const [categories, setCategories] = useState([])
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
  const [sortBy] = useState('createdAt')
  const [sortOrder] = useState('desc')
  const debouncedSearch = useDebouncedValue(search, 300)
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
    setCategories(normalized.items)
    setTotalItems(normalized.total)
    setTotalPages(normalized.totalPages)
    setListError(null)
  }, [])

  const loadCategories = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({
        page: effectivePage,
        pageSize,
        debouncedSearch,
        statusFilter,
        centerFilter,
        programFilter,
        sortBy,
        sortOrder,
      })

      const sessionKey = `${SESSION_SCOPE}:${JSON.stringify(params)}`

      await runGuardedListFetch({
        fetchGuard,
        sessionKey,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: async () => {
          const data = await getExamCategories(params, { bypassCache })
          return normalizeExamCategoriesListResponse(data, {
            page: effectivePage,
            limit: pageSize,
          })
        },
        applyData: applyPaginated,
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error)
          const message = isRateLimitError(error)
            ? MASTER_LIST_RATE_LIMIT_MESSAGE
            : fetchGuard.getListErrorMessage(error, 'Failed to load exam categories')

          if (isRateLimitError(error)) {
            fetchGuard.toastListError(message)
            return
          }

          setListError(message)
          fetchGuard.toastListError(message)

          if (!hydratedFromSession) {
            setCategories([])
            setTotalItems(0)
            setTotalPages(1)
          }
        },
        errorFallback: 'Failed to load exam categories',
      })
    },
    [
      effectivePage,
      pageSize,
      debouncedSearch,
      statusFilter,
      centerFilter,
      programFilter,
      sortBy,
      sortOrder,
      fetchGuard,
      applyPaginated,
    ],
  )

  useEffect(() => {
    let ignore = false
    loadCategories({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadCategories])

  useEffect(() => {
    setProgramFilter('all')
  }, [centerFilter])

  const refreshCategories = useCallback(async () => {
    clearExamCategoriesListCache()
    invalidateListSession(SESSION_SCOPE)
    setListError(null)
    await loadCategories({ bypassCache: true })
  }, [loadCategories])

  const patchCategoryLocally = useCallback((categoryId, patch) => {
    setCategories((prev) =>
      prev.map((row) =>
        String(row.id) === String(categoryId) ? { ...row, ...patch } : row,
      ),
    )
  }, [])

  const removeCategoryLocally = useCallback((categoryId) => {
    setCategories((prev) => prev.filter((row) => String(row.id) !== String(categoryId)))
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
    categories,
    totalCategories: totalItems,
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
    refreshCategories,
    patchCategoryLocally,
    removeCategoryLocally,
  }
}

/** @alias useExamCategoryManagement */
export const useExamCategories = useExamCategoryManagement
