import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { useDebouncedValue } from './useDebouncedValue'
import { useTestConfigLanguages } from './useTestConfigLanguages'
import { mapTestConfigLanguageStatusFilterToApi } from '../utils/testConfigLanguageApiHelpers'
import { getApiErrorMessage } from '../utils/apiError'

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SORT_PRESET = 'createdOn_newest'

export function useTestConfigLanguageManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sortPreset, setSortPreset] = useState(DEFAULT_SORT_PRESET)
  const debouncedSearch = useDebouncedValue(search, 300)

  const listParams = useMemo(() => {
    const apiStatus = mapTestConfigLanguageStatusFilterToApi(status)
    /** @type {import('../types/testConfigLanguage.types').TestConfigLanguageListParams} */
    const params = {
      page,
      limit: pageSize,
      search: debouncedSearch.trim(),
      sortPreset,
    }
    if (apiStatus) params.status = apiStatus
    return params
  }, [page, pageSize, debouncedSearch, status, sortPreset])

  const { data, isLoading, isFetching, error, refetch } = useTestConfigLanguages(listParams)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, sortPreset, pageSize])

  useEffect(() => {
    if (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to load languages'))
    }
  }, [error])

  const rows = data?.items ?? []
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const tableLoading = isLoading || (isFetching && !data)

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
    isFetching,
    search,
    setSearch,
    status,
    setStatus,
    sortPreset,
    setSortPreset,
    controlledPagination,
    refreshLanguages: refetch,
  }
}

export default useTestConfigLanguageManagement
