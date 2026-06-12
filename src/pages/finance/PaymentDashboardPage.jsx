import { useCallback, useState } from 'react'
import { LayoutDashboard, Download, RefreshCw, ShieldCheck } from 'lucide-react'
import { FINANCE_ROUTES } from '../../constants/financeNav'
import PageBanner from '../../components/figma/PageBanner'
import FinanceStatCard from '../../components/finance/FinanceStatCard'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceDashboardSkeleton from '../../components/finance/FinanceDashboardSkeleton'
import CentreWiseCollectionWidget from '../../components/finance/CentreWiseCollectionWidget'
import PendingEmiWidget from '../../components/finance/PendingEmiWidget'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { useFinanceDashboard } from '../../hooks/useFinanceDashboard'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { exportFinanceCsv } from '../../utils/financeExport'
import FinanceQuickActions from '../../components/finance/FinanceQuickActions'
import FinanceStatsGrid from '../../components/finance/FinanceStatsGrid'
import FinanceChartContainer from '../../components/finance/FinanceChartContainer'
import FinanceSectionHeader from '../../components/finance/FinanceSectionHeader'
import FinanceEmptyState from '../../components/finance/FinanceEmptyState'
import FinanceDashboardFilters from '../../components/finance/FinanceDashboardFilters'
import { TopPerformingCourseCard, CounselorRevenuePanel } from '../../components/finance/FinanceDashboardWidgets'
import {
  MonthlyRevenueBarChart,
  PaymentStatusPieChart,
  CourseRevenueChart,
  CollectionVsOutstandingChart,
  CenterMonthlyComparisonChart,
  FailedRecoveryChart,
  EmiAgingChart,
  DailyCollectionWidget,
} from '../../components/finance/FinanceCharts'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const DEFAULT_FILTERS = {
  course: 'all',
  month: 'all',
  batch: 'all',
  courseType: 'all',
  paymentType: 'all',
  studentType: 'all',
}

export default function PaymentDashboardPage() {
  const [courseFilter, setCourseFilter] = useState(DEFAULT_FILTERS.course)
  const [monthFilter, setMonthFilter] = useState(DEFAULT_FILTERS.month)
  const [batchFilter, setBatchFilter] = useState(DEFAULT_FILTERS.batch)
  const [courseTypeFilter, setCourseTypeFilter] = useState(DEFAULT_FILTERS.courseType)
  const [paymentTypeFilter, setPaymentTypeFilter] = useState(DEFAULT_FILTERS.paymentType)
  const [studentTypeFilter, setStudentTypeFilter] = useState(DEFAULT_FILTERS.studentType)
  const centerFilter = useFinanceCenterFilter()
  const { canExport } = useFinancePermissions()
  const { data, loading, refreshing, reload, lastUpdated } = useFinanceDashboard(
    courseFilter,
    monthFilter,
    batchFilter,
    courseTypeFilter,
    paymentTypeFilter,
    studentTypeFilter,
  )

  const stats = data?.stats
  const chartLoading = loading || refreshing
  const collectionPayments =
    data?.collectionPayments?.length > 0
      ? data.collectionPayments
      : [...(data?.recentPayments || []), ...(data?.recentFailed || [])]

  const paymentColumns = [
    { key: 'studentName', label: 'Student', render: (r) => <span className="font-medium">{r.studentName}</span> },
    { key: 'courseName', label: 'Course' },
    { key: 'centerName', label: 'Center', render: (r) => r.centerName || '—' },
    { key: 'amountPaid', label: 'Amount', render: (r) => formatINR(r.amountPaid) },
    { key: 'paymentStatus', label: 'Status', render: (r) => <FinanceStatusBadge status={r.paymentStatus} /> },
    { key: 'paymentDate', label: 'Date', render: (r) => formatCategoryDateTime(r.paymentDate) },
  ]

  const handleExport = useCallback(() => {
    if (!canExport) return toast.error('Export not permitted')
    const rows = [...(data?.recentPayments || []), ...(data?.recentFailed || [])]
    if (!rows.length) return toast.error('No data to export')
    exportFinanceCsv(rows, 'payment-dashboard-export.csv')
    toast.success('Dashboard exported')
  }, [canExport, data])

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null

  const shellActions = (
    <div className="flex flex-wrap items-center gap-2">
      {lastUpdatedLabel && (
        <span className="hidden text-xs text-white/80 sm:inline">Updated {lastUpdatedLabel}</span>
      )}
      <button
        type="button"
        onClick={reload}
        disabled={refreshing}
        aria-label="Refresh dashboard"
        className="rounded-lg border border-white/30 bg-white/10 p-2 text-white disabled:opacity-60"
      >
        <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
      </button>
      <button
        type="button"
        onClick={handleExport}
        aria-label="Export dashboard"
        className="rounded-lg border border-white/30 bg-white/10 p-2 text-white"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  )

  const kpiGroups = stats
    ? [
        {
          id: 'payment-verification',
          title: 'PAYMENT VERIFICATION',
          gridClassName: 'sm:grid-cols-1 lg:max-w-sm lg:grid-cols-1',
          cards: [
            <FinanceStatCard
              key="vp"
              label="Verification pending"
              value={stats.verificationPending ?? 0}
              icon={ShieldCheck}
              to={FINANCE_ROUTES.verification}
              className="bg-white/90"
            />,
          ],
        },
      ]
    : []

  const hasLegacyChartData =
    (data?.monthlyRevenue?.length ?? 0) > 0 ||
    (data?.paymentStatusBreakdown?.length ?? 0) > 0 ||
    (data?.courseWiseRevenue?.length ?? 0) > 0

  const tableResetDeps = [
    centerFilter.selectedIds,
    courseFilter,
    batchFilter,
    courseTypeFilter,
    paymentTypeFilter,
    studentTypeFilter,
    monthFilter,
  ]

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageBanner icon={LayoutDashboard} title="Payment Dashboard">
        {shellActions}
      </PageBanner>
      <FinanceDashboardFilters
        centerFilter={centerFilter}
        courseFilter={courseFilter}
        onCourseFilterChange={(e) => setCourseFilter(e.target.value)}
        monthFilter={monthFilter}
        onMonthFilterChange={(e) => setMonthFilter(e.target.value)}
        monthOptions={data?.monthlyRevenue || []}
        batchFilter={batchFilter}
        onBatchFilterChange={(e) => setBatchFilter(e.target.value)}
        courseTypeFilter={courseTypeFilter}
        onCourseTypeFilterChange={(e) => setCourseTypeFilter(e.target.value)}
        paymentTypeFilter={paymentTypeFilter}
        onPaymentTypeFilterChange={(e) => setPaymentTypeFilter(e.target.value)}
        studentTypeFilter={studentTypeFilter}
        onStudentTypeFilterChange={(e) => setStudentTypeFilter(e.target.value)}
        refreshing={refreshing}
        lastUpdatedLabel={lastUpdatedLabel}
      />

      <FinanceQuickActions onExport={handleExport} />

      {loading && !data ? (
        <FinanceDashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
            <DailyCollectionWidget
              payments={collectionPayments}
              loading={chartLoading}
              className="h-full min-h-[440px]"
            />
            <TopPerformingCourseCard
              payments={collectionPayments}
              loading={chartLoading}
              className="h-full min-h-[440px]"
            />
          </div>

          <CentreWiseCollectionWidget
            payments={
              data?.allTimeCollectionPayments?.length ? data.allTimeCollectionPayments : collectionPayments
            }
            loading={chartLoading}
          />

          <PendingEmiWidget
            payments={collectionPayments}
            emiPlans={data?.emiPlans || []}
            stats={stats}
            loading={chartLoading}
          />

          {stats && <FinanceStatsGrid groups={kpiGroups} defaultCollapsedOnMobile />}

          <FinanceSectionHeader title="Analytics" subtitle="Collections, centers & recovery" className="mt-2" />
          <FinanceChartContainer className="lg:grid-cols-2 xl:grid-cols-3">
            <CollectionVsOutstandingChart
              data={data?.collectionVsOutstanding}
              loading={chartLoading}
              className="min-w-0 xl:col-span-1"
            />
            <FailedRecoveryChart
              recovery={data?.failedRecovery}
              loading={chartLoading}
              className="min-w-0 xl:col-span-1"
            />
            <CenterMonthlyComparisonChart
              data={data?.centerMonthlyComparison}
              loading={chartLoading}
              className="min-w-0 sm:col-span-2 xl:col-span-2"
            />
            <EmiAgingChart
              data={data?.emiAging}
              loading={chartLoading}
              className="min-w-0 sm:col-span-2 xl:col-span-1"
            />
          </FinanceChartContainer>

          {hasLegacyChartData ? (
            <FinanceChartContainer>
              <MonthlyRevenueBarChart data={data?.monthlyRevenue || []} className="min-w-0" />
              <PaymentStatusPieChart data={data?.paymentStatusBreakdown || []} className="min-w-0" />
              <CourseRevenueChart data={data?.courseWiseRevenue || []} className="min-w-0 sm:col-span-2 lg:col-span-2" />
            </FinanceChartContainer>
          ) : (
            <FinanceEmptyState
              title="No chart data"
              description="Adjust filters or wait for payment data to populate analytics."
            />
          )}

          <CounselorRevenuePanel counselors={data?.counselorRevenue} loading={chartLoading} />

          <div className="min-w-0 overflow-hidden">
            <FinanceSectionHeader title="Recent successful payments" className="mb-3" />
            <PaginatedFigmaTable
              columns={paymentColumns}
              data={data?.recentPayments || []}
              itemLabel="payments"
              initialPageSize={5}
              resetDeps={tableResetDeps}
            />
          </div>

          <div className="min-w-0 overflow-hidden">
            <FinanceSectionHeader title="Recent failed / pending" className="mb-3" />
            <PaginatedFigmaTable
              columns={paymentColumns}
              data={data?.recentFailed || []}
              itemLabel="records"
              initialPageSize={5}
              resetDeps={tableResetDeps}
            />
          </div>

        </>
      )}

    </div>
  )
}
