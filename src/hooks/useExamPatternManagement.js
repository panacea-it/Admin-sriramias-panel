import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { getExamPatterns } from '../services/examPatternService'
import {
  mapExamPatternStatusFilterToApi,
  normalizeExamPatternsListResponse,
} from '../utils/examPatternApiHelpers'

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SORT_PRESET = 'createdOn_newest'

export function useExamPatternManagement() {
  const [rows, setRows] = useState([])
  const [tableLoading, setTableLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sortPreset, setSortPreset] = useState(DEFAULT_SORT_PRESET)
  const debouncedSearch = useDebouncedValue(search, 500)

  const fetchExamPatterns = useCallback(async () => {
    setTableLoading(true)
    try {
      const apiStatus = mapExamPatternStatusFilterToApi(status)
      const params = {
        page,
        limit: pageSize,
        search: debouncedSearch.trim(),
        sortPreset,
      }
      if (apiStatus) params.status = apiStatus

      const data = await getExamPatterns(params)
      const normalized = normalizeExamPatternsListResponse(data, { page, limit: pageSize })

      setRows(normalized.items)
      setTotalItems(normalized.total)
      setTotalPages(normalized.totalPages)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to load instructions'))
      setRows([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setTableLoading(false)
    }
  }, [page, pageSize, debouncedSearch, status, sortPreset])

  useEffect(() => {
    fetchExamPatterns()
  }, [fetchExamPatterns])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, sortPreset, pageSize])

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
    rows,
    tableLoading,
    search,
    setSearch,
    status,
    setStatus,
    sortPreset,
    setSortPreset,
    controlledPagination,
    refreshExamPatterns: fetchExamPatterns,
  }
}
