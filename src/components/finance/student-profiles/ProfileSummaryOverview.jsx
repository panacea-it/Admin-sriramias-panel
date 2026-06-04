import {
  IndianRupee,
  Wallet,
  Percent,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import FinanceStatCard from '../FinanceStatCard'
import { formatINR } from '../../../utils/financeFilters'
import { cn } from '../../../utils/cn'

const SUMMARY_CARDS = [
  { key: 'totalFees', label: 'Total Fees', icon: IndianRupee, accent: 'from-[#55ace7] to-[#246392]' },
  { key: 'scholarshipAmount', label: 'Scholarship', icon: Percent, accent: 'from-[#69df66] to-[#1a5c3a]' },
  { key: 'discountAmount', label: 'Discount', icon: Percent, accent: 'from-[#55ace7] to-[#69df66]' },
  { key: 'totalPaid', label: 'Total Paid', icon: CheckCircle2, accent: 'from-[#69df66] to-[#1a5c3a]' },
  { key: 'totalPending', label: 'Pending', icon: AlertCircle, accent: 'from-[#efb36d] to-[#b8887a]' },
  { key: 'activeEmiAmount', label: 'Active EMI', icon: TrendingUp, accent: 'from-[#55ace7] to-[#246392]' },
  { key: 'refundAmount', label: 'Refund', icon: IndianRupee, accent: 'from-[#df8284] to-[#b85c5e]' },
  { key: 'walletBalance', label: 'Wallet', icon: Wallet, accent: 'from-[#55ace7] to-[#246392]' },
]

export default function ProfileSummaryOverview({ profile }) {
  if (!profile) return null
  const health = profile.health || {}
  const progress = profile.paymentProgress ?? 0

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-xl border-2 bg-white p-4 shadow-sm',
          health.ring || 'ring-slate-100',
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Financial health</p>
            <p className="text-lg font-bold text-[#111]">{health.label || '—'}</p>
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-sm',
              health.color || 'from-[#55ace7] to-[#246392]',
            )}
            aria-label={`${progress}% collected`}
          >
            {progress}%
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-[#686868]">
            <span>Collection progress</span>
            <span className="font-semibold tabular-nums">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', health.color || 'from-[#55ace7] to-[#246392]')}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map(({ key, label, icon, accent }) => (
          <FinanceStatCard
            key={key}
            label={label}
            value={formatINR(profile[key] || 0)}
            icon={icon}
            accent={accent}
            className="!p-3"
          />
        ))}
      </div>
    </div>
  )
}
