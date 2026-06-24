import { Users, CalendarClock, AlertTriangle, Wallet, CalendarDays, CheckCircle2, FileWarning, UserX, TrendingUp } from 'lucide-react'
import FinanceStatCard from '../FinanceStatCard'
import FinanceChartContainer from '../FinanceChartContainer'
import { formatINR } from '../../../utils/financeFilters'
import { cn } from '../../../utils/cn'

function MetricStrip({ label, value, sub, trend, className }) {
  return (
    <div className={cn('rounded-lg border border-slate-100 bg-[#eef6fc]/50 px-3 py-2.5', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#686868]">{label}</p>
      <p className="text-lg font-bold text-[#246392]">{value}</p>
      {sub && <p className="text-xs text-[#686868]">{sub}</p>}
      {trend?.length > 0 && (
        <div className="mt-2 flex items-end gap-1 h-8">
          {trend.map((t) => (
            <div
              key={t.label}
              className="flex-1 rounded-t bg-[#df8284]/80 min-w-[6px]"
              style={{ height: `${Math.max(20, (t.days / Math.max(...trend.map((x) => x.days), 1)) * 100)}%` }}
              title={`${t.label}: ${t.days} days`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function EmiDashboardOverview({ summary, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  const s = summary || {}

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceStatCard icon={Users} label="Total EMI Students" value={s.totalStudents ?? 0} />
        <FinanceStatCard icon={CalendarClock} label="Active EMIs" value={s.activeEmis ?? 0} accent="from-[#55ace7] to-[#246392]" />
        <FinanceStatCard icon={AlertTriangle} label="Overdue EMIs" value={s.overdueEmis ?? 0} accent="from-[#df8284] to-[#b8887a]" />
        <FinanceStatCard icon={Wallet} label="Pending Amount" value={formatINR(s.pendingAmount ?? 0)} accent="from-[#efb36d] to-[#b8887a]" />
        <FinanceStatCard icon={CalendarDays} label="Due This Week" value={s.upcomingDueWeek ?? 0} />
        <FinanceStatCard icon={CheckCircle2} label="Settled Accounts" value={s.settledAccounts ?? 0} accent="from-[#69df66] to-[#246392]" />
        <FinanceStatCard icon={FileWarning} label="Foreclosure Requests" value={s.foreclosureRequests ?? 0} accent="from-[#efb36d] to-[#df8284]" />
        <FinanceStatCard icon={UserX} label="Suspended Students" value={s.suspendedStudents ?? 0} accent="from-[#df8284] to-[#686868]" />
      </div>

      <FinanceChartContainer className="lg:grid-cols-3">
        <MetricStrip label="Due %" value={`${s.duePercentage ?? 0}%`} sub="Open installments vs total" />
        <MetricStrip label="Collection rate" value={`${s.collectionRate ?? 0}%`} sub="Paid installments" />
        <MetricStrip
          label="Overdue trend"
          value={s.overdueEmis ? `${s.overdueEmis} accounts` : 'None'}
          sub="Top overdue (days)"
          trend={s.overdueTrend}
        />
      </FinanceChartContainer>

      {(s.counselorWorkload?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Counselor workload</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-[#686868]">
                  <th className="pb-2 pr-3">Counselor</th>
                  <th className="pb-2 pr-3">Assigned</th>
                  <th className="pb-2 pr-3">Pending EMIs</th>
                  <th className="pb-2">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {s.counselorWorkload.map((row) => (
                  <tr key={row.counselorId} className="border-b border-slate-50">
                    <td className="py-2 font-semibold">{row.counselorName}</td>
                    <td className="py-2">{row.assigned}</td>
                    <td className="py-2">{row.pendingEmis}</td>
                    <td className="py-2 text-red-700">{row.overdue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(s.providerAnalytics?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#246392]" />
            <h3 className="text-sm font-bold text-[#1a3a5c]">Loan provider analytics</h3>
          </div>
          <ul className="space-y-2">
            {s.providerAnalytics.map((row) => {
              const maxPending = Math.max(...s.providerAnalytics.map((p) => p.pending), 1)
              const pct = Math.round(((row.pending || 0) / maxPending) * 100)
              return (
                <li key={row.provider}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-[#222]">{row.provider}</span>
                    <span className="text-[#686868]">
                      {row.active} active · {row.overdue} overdue · {formatINR(row.pending)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#55ace7] to-[#246392] transition-all"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
