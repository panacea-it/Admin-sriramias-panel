import { LayoutDashboard, ShieldCheck } from 'lucide-react'
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

const DEFAULT_FILTERS = {
  course: 'all',
  month: 'all',
  batch: 'all',
  courseType: 'all',
  paymentType: 'all',
  studentType: 'all',
}

export default function PaymentDashboardPage() {
  const centerFilter = useFinanceCenterFilter()
  const { data, loading, refreshing } = useFinanceDashboard(
    DEFAULT_FILTERS.course,
    DEFAULT_FILTERS.month,
    DEFAULT_FILTERS.batch,
    DEFAULT_FILTERS.courseType,
    DEFAULT_FILTERS.paymentType,
    DEFAULT_FILTERS.studentType,
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

  const tableResetDeps = [centerFilter.selectedIds]

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageBanner icon={LayoutDashboard} title="Payment Dashboard" />
      <FinanceDashboardFilters centerFilter={centerFilter} />

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
