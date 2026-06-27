import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isRateLimitError } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import {
  clearExamSubCategoriesListCache,
  getSubCategories,
} from '../services/examSubCategoryService'
import {
  mapExamSubCategoryStatusFilterToApi,
  normalizeExamSubCategoriesListResponse,
} from '../utils/examSubCategoryApiHelpers'
import {
  buildFilterSignature,
  createListFetchGuard,
  invalidateListSession,
  runGuardedListFetch,
  useEffectivePage,
  MASTER_LIST_RATE_LIMIT_MESSAGE,
} from './useMasterListQuery'

const SESSION_SCOPE = 'exam-sub-categories'
const DEFAULT_PAGE_SIZE = 10

function buildListParams({
  page,
  pageSize,
  debouncedSearch,
  statusFilter,
  centerFilter,
  programFilter,
  categoryFilter,
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

  const apiStatus = mapExamSubCategoryStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus
  if (centerFilter !== 'all') params.center = centerFilter
  if (programFilter !== 'all') params.program = programFilter
  if (categoryFilter !== 'all') params.category = categoryFilter

  return params
}

export function useExamSubCategoryManagement() {
  const [subCategories, setSubCategories] = useState([])
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
  const [categoryFilter, setCategoryFilter] = useState('all')
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
    categoryFilter,
    pageSize,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const applyPaginated = useCallback((normalized) => {
    setSubCategories(normalized.items)
    setTotalItems(normalized.total)
    setTotalPages(normalized.totalPages)
    setListError(null)
  }, [])

  const fetchSubCategories = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({
        page: effectivePage,
        pageSize,
        debouncedSearch,
        statusFilter,
        centerFilter,
        programFilter,
        categoryFilter,
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
          const data = await getSubCategories(params, { bypassCache })
          return normalizeExamSubCategoriesListResponse(data, {
            page: effectivePage,
            limit: pageSize,
          })
        },
        applyData: applyPaginated,
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error)
          const message = isRateLimitError(error)
            ? MASTER_LIST_RATE_LIMIT_MESSAGE
            : fetchGuard.getListErrorMessage(error, 'Failed to load exam sub-categories')

          if (isRateLimitError(error)) {
            fetchGuard.toastListError(message)
            return
          }

          setListError(message)
          fetchGuard.toastListError(message)

          if (!hydratedFromSession) {
            setSubCategories([])
            setTotalItems(0)
            setTotalPages(1)
          }
        },
        errorFallback: 'Failed to load exam sub-categories',
      })
    },
    [
      effectivePage,
      pageSize,
      debouncedSearch,
      statusFilter,
      centerFilter,
      programFilter,
      categoryFilter,
      sortBy,
      sortOrder,
      fetchGuard,
      applyPaginated,
    ],
  )

  useEffect(() => {
    let ignore = false
    fetchSubCategories({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [fetchSubCategories])

  useEffect(() => {
    setProgramFilter('all')
    setCategoryFilter('all')
  }, [centerFilter])

  useEffect(() => {
    setCategoryFilter('all')
  }, [programFilter])

  const refreshSubCategories = useCallback(async () => {
    clearExamSubCategoriesListCache()
    invalidateListSession(SESSION_SCOPE)
    setListError(null)
    await fetchSubCategories({ bypassCache: true })
  }, [fetchSubCategories])

  const patchSubCategoryLocally = useCallback((subCategoryId, patch) => {
    setSubCategories((prev) =>
      prev.map((row) =>
        String(row.id) === String(subCategoryId) ? { ...row, ...patch } : row,
      ),
    )
  }, [])

  const removeSubCategoryLocally = useCallback((subCategoryId) => {
    setSubCategories((prev) => prev.filter((row) => String(row.id) !== String(subCategoryId)))
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
    subCategories,
    totalSubCategories: totalItems,
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
    categoryFilter,
    setCategoryFilter,
    debouncedSearch,
    controlledPagination,
    refreshSubCategories,
    patchSubCategoryLocally,
    removeSubCategoryLocally,
  }
}

/** @alias useExamSubCategoryManagement */
export const useExamSubCategories = useExamSubCategoryManagement
