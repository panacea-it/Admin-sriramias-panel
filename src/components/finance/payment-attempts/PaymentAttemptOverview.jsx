import FinanceStatCard from '../FinanceStatCard'
import FinanceChartContainer from '../FinanceChartContainer'
import { FailedRecoveryChart } from '../FinanceCharts'
import { RetryConversionTrendChart, RecoveryFunnelChart } from './PaymentAttemptCharts'
import { formatINR } from '../../../utils/financeFilters'
import { AlertTriangle, RotateCcw, ShieldAlert, TrendingUp } from 'lucide-react'

export default function PaymentAttemptOverview({ summary, recovery, retryRows, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  const retryRate = retryRows?.length
    ? Math.round((retryRows.filter((r) => r.successfulRetry).length / retryRows.length) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <FinanceStatCard label="Total attempts" value={summary?.total ?? 0} />
        <FinanceStatCard label="Successful" value={summary?.success ?? 0} accent="from-[#69df66] to-[#55ace7]" />
        <FinanceStatCard label="Failed" value={summary?.failed ?? 0} accent="from-[#df8284] to-[#b8887a]" />
        <FinanceStatCard icon={TrendingUp} label="Recovered" value={summary?.recovered ?? 0} accent="from-[#69df66] to-[#246392]" />
        <FinanceStatCard icon={RotateCcw} label="Retry conversion" value={`${retryRate}%`} accent="from-[#55ace7] to-[#246392]" />
        <FinanceStatCard icon={ShieldAlert} label="Fraud flags" value={summary?.suspicious ?? 0} accent="from-[#df8284] to-[#686868]" />
      </div>

      <FinanceChartContainer className="lg:grid-cols-3">
        <FailedRecoveryChart recovery={recovery} className="lg:col-span-2" />
        <RetryConversionTrendChart retryRows={retryRows} />
      </FinanceChartContainer>

      <FinanceChartContainer className="lg:grid-cols-2">
        <RecoveryFunnelChart funnel={recovery?.funnel} />
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Recovery highlights</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-[#686868]">Revenue recovered</dt>
              <dd className="font-bold text-[#246392]">{formatINR(recovery?.revenueRecovered ?? 0)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#686868]">Best counselor</dt>
              <dd className="font-semibold">{recovery?.bestCounselor?.name ?? '—'} ({recovery?.bestCounselor?.count ?? 0})</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#686868]">Best reminder channel</dt>
              <dd className="font-semibold">{recovery?.bestChannel?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#686868]">Top retry window</dt>
              <dd className="font-semibold">{recovery?.bestRetryWindow?.window ?? '—'}</dd>
            </div>
          </dl>
          {(summary?.suspicious ?? 0) > 0 && (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {summary.suspicious} attempt(s) flagged for fraud review
            </p>
          )}
        </div>
      </FinanceChartContainer>
    </div>
  )
}
