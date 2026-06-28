import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { buildFilterSignature, useEffectivePage } from './useMasterListQuery'
import { useMainsTopicTestsQuery } from './useMainsManagement'
import { toast } from '../utils/toast'
import { getApiErrorMessage } from '../utils/apiError'

const DEFAULT_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 500

export function useMainsTopicTestsManagement(topicId) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  const filterSignature = buildFilterSignature([debouncedSearch, pageSize, topicId])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(() => {
    const params = {
      page: effectivePage,
      limit: pageSize,
    }
    const trimmed = debouncedSearch.trim()
    if (trimmed) params.search = trimmed
    return params
  }, [effectivePage, pageSize, debouncedSearch])

  const { data, isLoading, isFetching, error, refetch } = useMainsTopicTestsQuery(
    topicId,
    listParams,
  )

  useEffect(() => {
    if (error) {
      console.error('[MainsManagement]', error)
      toast.error(getApiErrorMessage(error, 'Failed to load topic tests'))
    }
  }, [error])

  const tests = data?.items ?? []
  const topic = data?.topic ?? null
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const loading = isLoading || (isFetching && !data)

  const controlledPagination = useMemo(() => {
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
      onPageChange: setPage,
      onPageSizeChange: (size) => {
        setPageSize(Number(size))
        setPage(1)
      },
    }
  }, [page, pageSize, totalItems, totalPages])

  return {
    topic,
    tests,
    loading,
    search,
    setSearch,
    controlledPagination,
    refetch,
  }
}
