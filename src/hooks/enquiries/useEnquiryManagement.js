import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  assignEnquiryCounselor,
  fetchCounselorsByCenter,
  fetchEnquiries,
  fetchEnquiryDetails,
  fetchEnquiryFilterOptions,
  fetchEnquiryStats,
  updateEnquiryLeadStatus,
} from '../../api/enquiriesAPI'
import { useDebouncedValue } from '../useDebouncedValue'
import { buildFilterSignature, useEffectivePage } from '../useMasterListQuery'
import {
  formatEnquiryLeadStatusLabel,
  matchesSourcePage,
} from '../../data/enquiriesData'

const DEFAULT_PAGE_SIZE = 10

export const enquiryKeys = {
  all: ['enquiries'],
  list: (params) => [...enquiryKeys.all, 'list', params],
  stats: (centerId) => [...enquiryKeys.all, 'stats', centerId],
  filterOptions: () => [...enquiryKeys.all, 'filter-options'],
  counselors: (centerId) => [...enquiryKeys.all, 'counselors', centerId],
  details: (id) => [...enquiryKeys.all, 'details', id],
}

function buildCounselorOptions(counselors = []) {
  return [
    { value: '', label: 'Select Counselor', disabled: true },
    ...counselors.map((counselor) => ({
      value: counselor._id,
      label: counselor.fullName || counselor.officialEmail || 'Counselor',
    })),
  ]
}

export function useEnquiryManagement() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [centerFilter, setCenterFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [sourcePageFilter, setSourcePageFilter] = useState('all')

  const debouncedSearch = useDebouncedValue(search, 400)

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    centerFilter,
    dateFilter?.toISOString?.() || '',
    typeFilter,
    sourcePageFilter,
    pageSize,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(
    () => ({
      page: effectivePage,
      limit: pageSize,
      search: debouncedSearch,
      centerId: centerFilter,
      type: typeFilter,
      date: dateFilter,
    }),
    [effectivePage, pageSize, debouncedSearch, centerFilter, typeFilter, dateFilter],
  )

  const {
    data: listData,
    isLoading: listLoading,
    isFetching: listFetching,
    error: listError,
    refetch: refetchEnquiries,
  } = useQuery({
    queryKey: enquiryKeys.list(listParams),
    queryFn: ({ signal }) => fetchEnquiries(listParams, signal),
    placeholderData: keepPreviousData,
  })

  const {
    data: stats = {
      total: 0,
      newThisWeek: 0,
      conversionRate: '0%',
      actionPending: 0,
    },
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: enquiryKeys.stats(centerFilter),
    queryFn: ({ signal }) => fetchEnquiryStats(centerFilter, signal),
  })

  const { data: filterOptions } = useQuery({
    queryKey: enquiryKeys.filterOptions(),
    queryFn: ({ signal }) => fetchEnquiryFilterOptions(signal),
    staleTime: 5 * 60 * 1000,
  })

  const centerOptions = useMemo(() => {
    const centers = filterOptions?.centers || []
    return [
      { value: 'all', label: 'Center' },
      ...centers.map((center) => ({
        value: center._id,
        label: center.centerName || center.name || 'Center',
      })),
    ]
  }, [filterOptions])

  const leadStatusOptions = useMemo(() => {
    const statuses = filterOptions?.leadStatuses || []
    const values = statuses.length
      ? statuses.map((item) => item.value)
      : []

    return [
      { value: '', label: 'Select Status', disabled: true },
      ...values.map((status) => ({
        value: status,
        label: formatEnquiryLeadStatusLabel(status),
      })),
    ]
  }, [filterOptions])

  const rawEnquiries = listData?.data ?? []
  const enquiries = useMemo(() => {
    if (sourcePageFilter === 'all') return rawEnquiries
    return rawEnquiries.filter((row) =>
      matchesSourcePage(row.sourcePage, sourcePageFilter),
    )
  }, [rawEnquiries, sourcePageFilter])

  const paginationMeta = listData?.pagination || {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  }

  const totalItems = paginationMeta.total ?? 0
  const totalPages = paginationMeta.totalPages ?? 1

  const pagination = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages))
    const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)

    return {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: paginationMeta.hasNextPage ?? safePage < totalPages,
      hasPrevPage: paginationMeta.hasPrevPage ?? safePage > 1,
    }
  }, [page, pageSize, totalItems, totalPages, paginationMeta])

  const controlledPagination = useMemo(
    () => ({
      ...pagination,
      onPageChange: setPage,
      onPageSizeChange: (size) => {
        setPageSize(Number(size))
        setPage(1)
      },
    }),
    [pagination],
  )

  const uniqueCenterIds = useMemo(
    () => [...new Set(enquiries.map((row) => row.centerId).filter(Boolean))],
    [enquiries],
  )

  const counselorQueries = useQuery({
    queryKey: enquiryKeys.counselors(uniqueCenterIds.join(',')),
    queryFn: async ({ signal }) => {
      const entries = await Promise.all(
        uniqueCenterIds.map(async (centerId) => {
          const counselors = await fetchCounselorsByCenter(centerId, signal)
          return [centerId, buildCounselorOptions(counselors)]
        }),
      )
      return Object.fromEntries(entries)
    },
    enabled: uniqueCenterIds.length > 0,
    staleTime: 2 * 60 * 1000,
  })

  const counselorsByCenterId = counselorQueries.data || {}

  const fetchCounselorsForCenter = useCallback(
    async (centerId) => {
      if (!centerId) return buildCounselorOptions([])
      if (counselorsByCenterId[centerId]) {
        return counselorsByCenterId[centerId]
      }
      const counselors = await fetchCounselorsByCenter(centerId)
      const options = buildCounselorOptions(counselors)
      queryClient.setQueryData(
        enquiryKeys.counselors(uniqueCenterIds.join(',')),
        (prev = {}) => ({ ...prev, [centerId]: options }),
      )
      return options
    },
    [counselorsByCenterId, queryClient, uniqueCenterIds],
  )

  const statusMutation = useMutation({
    mutationFn: ({ enquiryId, leadStatus }) =>
      updateEnquiryLeadStatus(enquiryId, leadStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiryKeys.all })
    },
  })

  const assignMutation = useMutation({
    mutationFn: ({ enquiryId, counselorId }) =>
      assignEnquiryCounselor(enquiryId, counselorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiryKeys.all })
    },
  })

  const fetchDetails = useCallback(
    (enquiryId, signal) => fetchEnquiryDetails(enquiryId, signal),
    [],
  )

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, centerFilter, dateFilter, typeFilter, sourcePageFilter, pageSize])

  const refreshAll = useCallback(() => {
    refetchEnquiries()
    refetchStats()
  }, [refetchEnquiries, refetchStats])

  return {
    enquiries,
    stats,
    loading: listLoading || listFetching,
    statsLoading,
    loadError: listError,
    search,
    setSearch,
    centerFilter,
    setCenterFilter,
    dateFilter,
    setDateFilter,
    typeFilter,
    setTypeFilter,
    sourcePageFilter,
    setSourcePageFilter,
    centerOptions,
    leadStatusOptions,
    counselorsByCenterId,
    fetchCounselorsForCenter,
    controlledPagination,
    statusMutation,
    assignMutation,
    fetchDetails,
    refreshAll,
    tableResetDeps: [
      debouncedSearch,
      centerFilter,
      dateFilter,
      typeFilter,
      sourcePageFilter,
      page,
      pageSize,
    ],
  }
}
