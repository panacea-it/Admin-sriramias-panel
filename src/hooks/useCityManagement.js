import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isRateLimitError } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { clearCitiesListCache, getCities } from '../services/cityService'
import {
  applyCityCodesToList,
  mapCityStatusFilterToApi,
  normalizeCitiesListResponse,
} from '../utils/cityApiHelpers'
import {
  buildFilterSignature,
  createListFetchGuard,
  invalidateListSession,
  runGuardedListFetch,
  useEffectivePage,
} from './useMasterListQuery'

const SESSION_SCOPE = 'cities'
const DEFAULT_PAGE_SIZE = 10

function buildListParams({ page, pageSize, debouncedSearch, statusFilter, centerFilter }) {
  const apiStatus = mapCityStatusFilterToApi(statusFilter)
  const params = {
    page,
    limit: pageSize,
    search: debouncedSearch.trim(),
  }
  if (apiStatus) params.status = apiStatus
  if (centerFilter !== 'all') params.center = centerFilter
  return params
}

export function useCityManagement() {
  const [cities, setCities] = useState([])
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
    debouncedSearch,
    statusFilter,
    centerFilter,
    pageSize,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const applyPaginated = useCallback((normalized) => {
    setCities(normalized.items)
    setTotalItems(normalized.total)
    setTotalPages(normalized.totalPages)
  }, [])

  const loadCities = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({
        page: effectivePage,
        pageSize,
        debouncedSearch,
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
          const data = await getCities(params, { bypassCache })
          const normalized = normalizeCitiesListResponse(data, {
            page: effectivePage,
            limit: pageSize,
          })
          const items = applyCityCodesToList(normalized.items, {
            page: effectivePage,
            limit: pageSize,
          })
          return { ...normalized, items }
        },
        applyData: applyPaginated,
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) console.error(error)
          fetchGuard.toastListError(fetchGuard.getListErrorMessage(error, 'Failed to load cities'))
          if (!isRateLimitError(error) && !hydratedFromSession) {
            setCities([])
            setTotalItems(0)
            setTotalPages(1)
          }
        },
      })
    },
    [effectivePage, pageSize, debouncedSearch, statusFilter, centerFilter, fetchGuard, applyPaginated],
  )

  useEffect(() => {
    let ignore = false
    loadCities({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadCities])

  const refreshCities = useCallback(async () => {
    clearCitiesListCache()
    invalidateListSession(SESSION_SCOPE)
    await loadCities({ bypassCache: true })
  }, [loadCities])

  const patchCityLocally = useCallback((id, patch) => {
    setCities((prev) =>
      prev.map((row) => {
        if (String(row.id) !== String(id)) return row
        const code = patch.code ?? patch.cityCode ?? row.code
        return {
          ...row,
          ...patch,
          code,
          cityCode: code ?? row.cityCode,
        }
      }),
    )
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
    cities,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    debouncedSearch,
    controlledPagination,
    refreshCities,
    patchCityLocally,
  }
}
