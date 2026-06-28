import { useEffect, useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import TestManagementAnalyticsSection from '../../components/test-management/TestManagementAnalyticsSection'
import ErrorState from '../../components/feedback/ErrorState'
import { fetchLiveTMData } from '../../api/tmDashboardAPI'
import { normalizeDashboardAnalytics } from '../../utils/testManagementDashboardHelpers'

const EMPTY_ANALYTICS = normalizeDashboardAnalytics()

export default function TestManagementAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await fetchLiveTMData(controller.signal)
        if (!result) {
          setAnalyticsData(EMPTY_ANALYTICS)
          return
        }
        setAnalyticsData(normalizeDashboardAnalytics(result))
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
        setLoadError(error?.message || 'Failed to load analytics')
        toast.error('Failed to load test management analytics')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  if (loading) {
    return (
      <TestManagementPageShell icon={BarChart3} title="Test Management Analytics">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#55ace7]" />
        </div>
      </TestManagementPageShell>
    )
  }

  if (loadError) {
    return (
      <TestManagementPageShell icon={BarChart3} title="Test Management Analytics">
        <ErrorState title="Unable to load analytics" message={loadError} onRetry={() => window.location.reload()} />
      </TestManagementPageShell>
    )
  }

  return (
    <TestManagementPageShell icon={BarChart3} title="Test Management Analytics">
      <TestManagementAnalyticsSection analyticsData={analyticsData ?? EMPTY_ANALYTICS} />
    </TestManagementPageShell>
  )
}
