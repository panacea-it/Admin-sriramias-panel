import { BarChart3, Download } from 'lucide-react'
import FinanceStatCard from '../FinanceStatCard'
import FinanceChartContainer from '../FinanceChartContainer'
import { formatINR } from '../../../utils/financeFilters'
import { OFFLINE_BRANCH_LABELS } from '../../../constants/offlinePaymentApproval'

export default function OfflineDailySummaryPanel({ summary, onExport }) {
  if (!summary) return null

  const chartData = (summary.branchBreakdown || []).map((b) => ({
    label: OFFLINE_BRANCH_LABELS[b.branchCode] || b.branchCode,
    value: b.amount,
    count: b.count,
  }))

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#222]">Daily offline summary</h2>
          <p className="text-xs text-[#686868]">Collections, approvals, and branch-wise breakdown</p>
        </div>
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#246392] hover:bg-[#eef6fc]"
          >
            <Download className="h-3.5 w-3.5" /> Export summary
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <FinanceStatCard label="Total offline" value={formatINR(summary.totalOffline)} />
        <FinanceStatCard label="Approved collections" value={formatINR(summary.totalCollections)} />
        <FinanceStatCard label="Cash" value={formatINR(summary.cashCollections)} />
        <FinanceStatCard label="Bank transfer" value={formatINR(summary.bankCollections)} />
        <FinanceStatCard label="Cheque" value={formatINR(summary.chequeCollections)} />
        <FinanceStatCard label="Pending approvals" value={summary.pendingApprovals} />
        <FinanceStatCard label="Rejected" value={summary.rejectedPayments} />
      </div>

      {chartData.length > 0 && (
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#222]">
            <BarChart3 className="h-4 w-4 text-[#246392]" /> Branch-wise totals
          </p>
          <FinanceChartContainer>
            {chartData.map((b) => (
              <div key={b.label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-xs font-semibold text-[#686868]">{b.label}</p>
                <p className="mt-1 text-lg font-bold text-[#222]">{formatINR(b.value)}</p>
                <p className="text-xs text-[#9ca0a8]">{b.count} payments</p>
              </div>
            ))}
          </FinanceChartContainer>
        </div>
      )}
    </section>
  )
}
