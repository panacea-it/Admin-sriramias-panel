import { useCallback, useState } from 'react'
import {
  LayoutDashboard,
  IndianRupee,
  Clock,
  AlertTriangle,
  CalendarClock,
  Banknote,
  TrendingUp,
  Download,
  RefreshCw,
  Building2,
  ShieldCheck,
} from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import FinanceStatCard from '../../components/finance/FinanceStatCard'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceDashboardSkeleton from '../../components/finance/FinanceDashboardSkeleton'
import CenterPerformanceCards from '../../components/finance/CenterPerformanceCards'
import CenterDrillDownModal from '../../components/finance/CenterDrillDownModal'
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
  PaymentSuccessRatioChart,
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
  const [drillCenter, setDrillCenter] = useState(null)
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
          id: 'revenue',
          title: 'Revenue & Collections',
          cards: [
            <FinanceStatCard key="tr" label="Total revenue" value={formatINR(stats.totalRevenue)} icon={IndianRupee} className="bg-white/90" />,
            <FinanceStatCard key="tc" label="Today's collections" value={formatINR(stats.todayCollections)} icon={TrendingUp} className="bg-white/90" />,
            <FinanceStatCard key="mc" label="Monthly collections" value={formatINR(stats.monthlyCollections)} icon={IndianRupee} className="bg-white/90" />,
            <FinanceStatCard key="sr" label="Payment success rate" value={`${stats.paymentSuccessRate ?? data?.paymentSuccessRate ?? 94}%`} icon={Building2} className="bg-white/90" />,
          ],
        },
        {
          id: 'pending',
          title: 'Pending & Risk',
          cards: [
            <FinanceStatCard key="pr" label="Pending revenue" value={formatINR(stats.pendingRevenue ?? stats.pendingPayments * 5000)} icon={Clock} className="bg-white/90" />,
            <FinanceStatCard key="td" label="Total due" value={formatINR(stats.totalDue ?? 0)} icon={Clock} className="bg-white/90" />,
            <FinanceStatCard key="oa" label="Overdue amount" value={formatINR(stats.overdueAmount ?? 0)} icon={AlertTriangle} accent="from-[#df8284] to-[#b8887a]" className="bg-white/90" />,
            <FinanceStatCard key="fp" label="Failed payments" value={stats.failedPayments} icon={AlertTriangle} accent="from-[#df8284] to-[#b8887a]" className="bg-white/90" />,
          ],
        },
        {
          id: 'ops',
          title: 'Operations',
          cards: [
            <FinanceStatCard key="vp" label="Verification pending" value={stats.verificationPending ?? 0} icon={ShieldCheck} className="bg-white/90" />,
            <FinanceStatCard key="emi" label="EMI active students" value={stats.emiActiveStudents} icon={CalendarClock} className="bg-white/90" />,
            <FinanceStatCard key="off" label="Offline approvals" value={stats.offlineApprovalsPending} icon={Banknote} className="bg-white/90" />,
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
          <div className="grid gap-4 lg:grid-cols-3">
            <DailyCollectionWidget
              daily={data?.dailyCollection}
              loading={chartLoading}
              className="lg:col-span-1"
            />
            <TopPerformingCourseCard
              course={data?.topPerformingCourse}
              leaderboard={data?.topCoursesLeaderboard}
              loading={chartLoading}
              className="lg:col-span-2"
            />
          </div>

          {centerFilter.isOverallView && (
            <CenterPerformanceCards performance={data?.performance} loading={loading} />
          )}

          {data?.centerRanking?.length > 0 && (centerFilter.isOverallView || centerFilter.isMultiView) && (
            <div className="overflow-hidden rounded-xl bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:p-5">
              <FinanceSectionHeader title="Center revenue ranking" subtitle="Top 5 by collection" />
              <div className="mt-3 space-y-2">
                {data.centerRanking.slice(0, 5).map((c) => (
                  <button
                    key={c.centerId}
                    type="button"
                    onClick={() => {
                      const match = centerFilter.selectedCenters.find((x) => x.centerName === c.centerName)
                        || { centerId: c.centerId, centerName: c.centerName, centerCode: c.centerCode, ...c }
                      setDrillCenter(match)
                    }}
                    className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-left text-sm transition hover:bg-slate-100"
                  >
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#246392] text-xs font-bold text-white">
                        {c.rank}
                      </span>
                      <span className="truncate">{c.centerName}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-[#246392]">{formatINR(c.totalRevenue)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {stats && <FinanceStatsGrid groups={kpiGroups} defaultCollapsedOnMobile />}

          <FinanceSectionHeader title="Analytics" subtitle="Collections, centers & recovery" className="mt-2" />
          <FinanceChartContainer className="lg:grid-cols-2 xl:grid-cols-3">
            <CollectionVsOutstandingChart
              data={data?.collectionVsOutstanding}
              loading={chartLoading}
              className="min-w-0 xl:col-span-1"
            />
            <PaymentSuccessRatioChart
              ratio={data?.paymentSuccessRatio}
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

      <CenterDrillDownModal center={drillCenter} data={data} onClose={() => setDrillCenter(null)} />
    </div>
  )
}
