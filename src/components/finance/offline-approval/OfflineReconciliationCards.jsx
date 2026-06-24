import { AlertTriangle, CheckCircle2, Clock, Scale } from 'lucide-react'
import FinanceStatCard from '../FinanceStatCard'
import { formatINR } from '../../../utils/financeFilters'
import { OFFLINE_RECONCILIATION_STATUSES } from '../../../constants/offlinePaymentApproval'

export default function OfflineReconciliationCards({ summary }) {
  if (!summary) return null

  const mismatchCount = summary.mismatchCount ?? 0
  const pendingCount = summary.pendingReconciliation ?? 0
  const matchedCount = summary.matchedCount ?? 0
  const reconciledCount = summary.reconciledCount ?? 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <FinanceStatCard
        label="Cash matched"
        value={matchedCount}
        icon={CheckCircle2}
        accent="from-[#69df66] to-[#55ace7]"
      />
      <FinanceStatCard label="Pending verification" value={pendingCount} icon={Clock} />
      <FinanceStatCard
        label="Mismatch detected"
        value={mismatchCount}
        icon={AlertTriangle}
        accent={mismatchCount > 0 ? 'from-[#df8284] to-[#b94b4b]' : undefined}
      />
      <FinanceStatCard label="Reconciled today" value={reconciledCount} icon={Scale} />
      {summary.totalDifference != null && summary.totalDifference !== 0 && (
        <div className="sm:col-span-2 xl:col-span-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Daily cash difference:</span>{' '}
          {formatINR(Math.abs(summary.totalDifference))}{' '}
          {summary.totalDifference < 0 ? 'short' : 'over'} across cash entries
        </div>
      )}
    </div>
  )
}

export function OfflineReconciliationBadge({ status }) {
  const styles = {
    Matched: 'bg-[#69df66]/15 text-[#1a3a5c] ring-[#69df66]/30',
    'Pending Verification': 'bg-slate-100 text-slate-700 ring-slate-200',
    'Mismatch Detected': 'bg-[#df8284]/15 text-[#b94b4b] ring-[#df8284]/30',
    Reconciled: 'bg-[#eef6fc] text-[#246392] ring-[#55ace7]/30',
  }
  const label = status || OFFLINE_RECONCILIATION_STATUSES[1]
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${styles[label] || styles['Pending Verification']}`}
    >
      {label}
    </span>
  )
}
