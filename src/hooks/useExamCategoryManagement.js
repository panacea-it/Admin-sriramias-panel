import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isRateLimitError } from '../utils/apiError'
import {
  clearExamCategoriesListCache,
  getExamCategories,
} from '../services/examCategoryService'
import {
  mapExamCategoryStatusFilterToApi,
  normalizeExamCategoriesListResponse,
} from '../utils/examCategoryApiHelpers'
import { matchesExamCategorySearch } from '../utils/examCategoryHelpers'
import {
  createListFetchGuard,
  getListSessionCache,
  invalidateListSession,
  runGuardedListFetch,
  MASTER_LIST_RATE_LIMIT_MESSAGE,
} from './useMasterListQuery'

const SESSION_SCOPE = 'exam-categories'

function buildListParams({ statusFilter, centerFilter }) {
  const params = {}

  const apiStatus = mapExamCategoryStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus
  if (centerFilter !== 'all') params.center = centerFilter

  return params
}

function buildSessionKey(params) {
  return `${SESSION_SCOPE}:${JSON.stringify(params)}`
}

function getInitialState() {
  const params = buildListParams({ statusFilter: 'all', centerFilter: 'all' })
  const cached = getListSessionCache(buildSessionKey(params))
  return {
    categories: cached ?? [],
    loading: cached == null,
  }
}

export function useExamCategoryManagement() {
  const initial = useMemo(() => getInitialState(), [])
  const [categories, setCategories] = useState(initial.categories)
  const [loading, setLoading] = useState(initial.loading)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const fetchGuardRef = useRef(null)

  if (!fetchGuardRef.current) {
    fetchGuardRef.current = createListFetchGuard()
  }
  const fetchGuard = fetchGuardRef.current

  const loadCategories = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({ statusFilter, centerFilter })
      const sessionKey = buildSessionKey(params)

      await runGuardedListFetch({
        fetchGuard,
        sessionKey,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: () => getExamCategories(params, { bypassCache }),
        applyData: (data) => setCategories(normalizeExamCategoriesListResponse(data)),
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error)
          if (isRateLimitError(error)) {
            fetchGuard.toastListError(MASTER_LIST_RATE_LIMIT_MESSAGE)
            return
          }
          fetchGuard.toastListError(
            fetchGuard.getListErrorMessage(error, 'Failed to load exam categories'),
          )
          if (!hydratedFromSession) setCategories([])
        },
      })
    },
    [statusFilter, centerFilter, fetchGuard],
  )

  const filteredCategories = useMemo(
    () => categories.filter((row) => matchesExamCategorySearch(row, search)),
    [categories, search],
  )

  useEffect(() => {
    let ignore = false
    loadCategories({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadCategories])

  const refreshCategories = useCallback(async () => {
    clearExamCategoriesListCache()
    invalidateListSession(SESSION_SCOPE)
    await loadCategories({ bypassCache: true })
  }, [loadCategories])

  const patchCategoryLocally = useCallback((categoryId, patch) => {
    setCategories((prev) =>
      prev.map((row) => (String(row.id) === String(categoryId) ? { ...row, ...patch } : row)),
    )
  }, [])

  const removeCategoryLocally = useCallback((categoryId) => {
    setCategories((prev) => prev.filter((row) => String(row.id) !== String(categoryId)))
  }, [])

  return {
    categories: filteredCategories,
    totalCategories: categories.length,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    refreshCategories,
    patchCategoryLocally,
    removeCategoryLocally,
  }
}
