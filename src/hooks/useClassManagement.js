import { useCallback, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { useClassSections } from './useClassSections'
import { CLASS_SORT_KEY_TO_API, CLASS_UI_SORT_FROM_API } from '../pages/academics/categories/classes/classApiHelpers'
import { buildFilterSignature, useEffectivePage } from './useMasterListQuery'

const DEFAULT_PAGE_SIZE = 10

/**
 * Classes page list state — backed by POST /api/academics/classes/list (Class Sections).
 */
export function useClassManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const debouncedSearch = useDebouncedValue(search, 300)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    subjectFilter,
    classFilter,
    pageSize,
    sortBy,
    sortOrder,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(() => {
    /** @type {import('../types/classSection.types').ClassSectionListParams} */
    const params = {
      page: effectivePage,
      limit: pageSize,
      sortBy,
      sortOrder,
    }

    const trimmedSearch = debouncedSearch.trim()
    if (classFilter !== 'all') {
      params.search = classFilter
    } else if (trimmedSearch) {
      params.search = trimmedSearch
    }

    if (subjectFilter !== 'all') params.subjectId = subjectFilter

    return params
  }, [effectivePage, pageSize, debouncedSearch, subjectFilter, classFilter, sortBy, sortOrder])

  const { data, isLoading, isFetching, isError, error, refetch } = useClassSections(listParams)

  const classes = data?.items ?? []
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

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

  const handleSort = useCallback((columnKey) => {
    const apiKey = CLASS_SORT_KEY_TO_API[columnKey] || columnKey
    const allowed = ['createdAt', 'className', 'status', 'classSectionId']
    if (!allowed.includes(apiKey)) return

    setSortBy((prev) => {
      if (prev === apiKey) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortOrder('asc')
      return apiKey
    })
  }, [])

  const uiSortBy = useMemo(() => CLASS_UI_SORT_FROM_API[sortBy] || sortBy, [sortBy])

  return {
    classes,
    loading: isLoading,
    isFetching,
    listError: isError ? error : null,
    search,
    setSearch,
    subjectFilter,
    setSubjectFilter,
    classFilter,
    setClassFilter,
    sortBy: uiSortBy,
    sortOrder,
    handleSort,
    controlledPagination,
    refreshClasses: refetch,
    listParams,
  }
}
