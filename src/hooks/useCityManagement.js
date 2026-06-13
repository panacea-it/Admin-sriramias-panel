import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage, isRateLimitError } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { clearCitiesListCache, getCities, getCityById } from '../services/cityService'
import {
  enrichCitiesWithMissingCodes,
  mapCityStatusFilterToApi,
  normalizeCitiesListResponse,
} from '../utils/cityApiHelpers'

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
  const debouncedSearch = useDebouncedValue(search, 500)
  const lastErrorToastAt = useRef(0)

  const loadCities = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({
        page,
        pageSize,
        debouncedSearch,
        statusFilter,
        centerFilter,
      })

      setLoading(true)
      try {
        const data = await getCities(params, { bypassCache })
        if (ignoreFlag?.()) return
        const normalized = normalizeCitiesListResponse(data, { page, limit: pageSize })
        const enriched = await enrichCitiesWithMissingCodes(normalized.items, getCityById, {
          page,
          limit: pageSize,
        })
        if (ignoreFlag?.()) return
        setCities(enriched)
        setTotalItems(normalized.total)
        setTotalPages(normalized.totalPages)
      } catch (error) {
        if (ignoreFlag?.()) return
        if (import.meta.env.DEV) {
          console.error(error)
        }
        const now = Date.now()
        if (now - lastErrorToastAt.current > 4000) {
          lastErrorToastAt.current = now
          toast.error(getApiErrorMessage(error, 'Failed to load cities'))
        }
        if (!isRateLimitError(error)) {
          setCities([])
          setTotalItems(0)
          setTotalPages(1)
        }
      } finally {
        if (!ignoreFlag?.()) {
          setLoading(false)
        }
      }
    },
    [page, pageSize, debouncedSearch, statusFilter, centerFilter],
  )

  useEffect(() => {
    let ignore = false
    loadCities({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadCities])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, centerFilter, pageSize])

  const refreshCities = useCallback(async () => {
    clearCitiesListCache()
    await loadCities({ bypassCache: true })
  }, [loadCities])

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
  }
}
