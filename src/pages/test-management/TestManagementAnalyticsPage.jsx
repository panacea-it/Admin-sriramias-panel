import { BarChart3, Loader2 } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import TestManagementAnalyticsSection from '../../components/test-management/TestManagementAnalyticsSection'
import ErrorState from '../../components/feedback/ErrorState'
import { useTestManagementDashboard } from '../../hooks/useTestManagementDashboard'
import { normalizeDashboardAnalytics } from '../../utils/testManagementDashboardHelpers'

const EMPTY_ANALYTICS = normalizeDashboardAnalytics()

export default function TestManagementAnalyticsPage() {
  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useTestManagementDashboard()

  const showInitialLoading = isLoading && !data

  if (showInitialLoading) {
    return (
      <TestManagementPageShell icon={BarChart3} title="Test Management Analytics">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#55ace7]" />
        </div>
      </TestManagementPageShell>
    )
  }

  if (isError && !data) {
    return (
      <TestManagementPageShell icon={BarChart3} title="Test Management Analytics">
        <ErrorState
          title="Unable to load analytics"
          message="Dashboard data is unavailable."
          onRetry={() => refetch()}
          retryLabel={isFetching ? 'Retrying…' : 'Try again'}
        />
      </TestManagementPageShell>
    )
  }

  const analyticsData = normalizeDashboardAnalytics(data ?? EMPTY_ANALYTICS)

  return (
    <TestManagementPageShell icon={BarChart3} title="Test Management Analytics">
      <TestManagementAnalyticsSection analyticsData={analyticsData} />
    </TestManagementPageShell>
  )
}
