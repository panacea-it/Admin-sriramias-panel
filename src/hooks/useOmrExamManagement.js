import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { useDebouncedValue } from './useDebouncedValue'
import { useOmrExams } from './useOmrExams'
import {
  mapOmrStatusFilterToApi,
  resolveOmrSortPreset,
} from '../utils/omrApiHelpers'
import { getApiErrorMessage } from '../utils/apiError'

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SORT_PRESET = 'createdAt_desc'

export function useOmrExamManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortPreset, setSortPreset] = useState(DEFAULT_SORT_PRESET)
  const debouncedSearch = useDebouncedValue(search, 400)

  const { sortBy, sortOrder } = resolveOmrSortPreset(sortPreset)

  const listParams = useMemo(() => {
    /** @type {import('../types/omrExam.types').ListOmrExamsParams} */
    const params = {
      page,
      limit: pageSize,
      search: debouncedSearch.trim(),
      status: mapOmrStatusFilterToApi(statusFilter),
      sortBy,
      sortOrder,
    }
    return params
  }, [page, pageSize, debouncedSearch, statusFilter, sortBy, sortOrder])

  const { data, isLoading, isFetching, error, refetch } = useOmrExams(listParams)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, sortPreset, pageSize])

  useEffect(() => {
    if (error) {
      if (import.meta.env.DEV) console.error(error)
      toast.error(getApiErrorMessage(error, 'Failed to load OMR exams'))
    }
  }, [error])

  const exams = data?.items ?? []
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const loading = isLoading || (isFetching && !data)

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
    exams,
    loading,
    isFetching,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortPreset,
    setSortPreset,
    sortBy,
    sortOrder,
    controlledPagination,
    refreshExams: refetch,
    retryLoad: refetch,
  }
}

/** @deprecated Use useOmrExamManagement */
export const useOmrManagement = useOmrExamManagement

export default useOmrExamManagement
