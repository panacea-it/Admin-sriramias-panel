import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { useCBTTests } from './useCBTTests'
import { buildListFilters } from '../utils/cbtTestFormHelpers'

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SORT = 'createdAt:desc'

export function useCbtTestsManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [facultySubjectId, setFacultySubjectId] = useState('all')
  const [folderId, setFolderId] = useState('all')
  const [batchId, setBatchId] = useState('all')
  const [language, setLanguage] = useState('all')
  const [publishStatus, setPublishStatus] = useState('all')
  const [scheduleDateFrom, setScheduleDateFrom] = useState('')
  const [scheduleDateTo, setScheduleDateTo] = useState('')
  const [sortPreset, setSortPreset] = useState(DEFAULT_SORT)

  const debouncedSearch = useDebouncedValue(search, 500)

  const listFilters = useMemo(
    () =>
      buildListFilters({
        page,
        limit: pageSize,
        search: debouncedSearch,
        facultySubjectId,
        folderId,
        batchId,
        language,
        publishStatus,
        scheduleDateFrom,
        scheduleDateTo,
        sortPreset,
      }),
    [
      page,
      pageSize,
      debouncedSearch,
      facultySubjectId,
      folderId,
      batchId,
      language,
      publishStatus,
      scheduleDateFrom,
      scheduleDateTo,
      sortPreset,
    ],
  )

  const { data, isLoading, isFetching, error, refetch } = useCBTTests(listFilters)

  useEffect(() => {
    setPage(1)
  }, [
    debouncedSearch,
    facultySubjectId,
    folderId,
    batchId,
    language,
    publishStatus,
    scheduleDateFrom,
    scheduleDateTo,
    sortPreset,
    pageSize,
  ])

  useEffect(() => {
    if (facultySubjectId === 'all') {
      setFolderId('all')
      setBatchId('all')
    }
  }, [facultySubjectId])

  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const controlledPagination = useMemo(
    () => ({
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [safePage, pageSize, totalItems, totalPages, startIndex, endIndex],
  )

  return {
    rows: data?.items ?? [],
    tableLoading: isLoading || isFetching,
    error,
    search,
    setSearch,
    facultySubjectId,
    setFacultySubjectId,
    folderId,
    setFolderId,
    batchId,
    setBatchId,
    language,
    setLanguage,
    publishStatus,
    setPublishStatus,
    scheduleDateFrom,
    setScheduleDateFrom,
    scheduleDateTo,
    setScheduleDateTo,
    sortPreset,
    setSortPreset,
    controlledPagination,
    refreshTests: refetch,
  }
}
