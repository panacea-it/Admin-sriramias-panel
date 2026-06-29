import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchTestManagementDashboard } from '../services/testManagementDashboardService'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '../utils/toast'

export const testManagementDashboardKeys = {
  all: ['test-management-dashboard'],
  dashboard: (filters = {}) => ['test-management-dashboard', filters],
}

function dashboardQueryRetry(failureCount, error) {
  const status = error?.status ?? error?.response?.status
  if ([400, 401, 403, 404].includes(status)) return false
  return failureCount < 2
}

/**
 * @param {Record<string, unknown>} [filters]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useTestManagementDashboard(filters = {}, options = {}) {
  const query = useQuery({
    queryKey: testManagementDashboardKeys.dashboard(filters),
    queryFn: ({ signal }) => fetchTestManagementDashboard(filters, { signal }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    retry: dashboardQueryRetry,
    ...options,
  })

  useEffect(() => {
    if (!query.isError || query.isFetching) return
    toast.error(getApiErrorMessage(query.error, 'Unable to load dashboard.'))
  }, [query.isError, query.isFetching, query.error])

  return query
}
