import { IndianRupee, Wallet, Percent, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import FinanceStatCard from '../FinanceStatCard'
import { formatINR } from '../../../utils/financeFilters'
import { cn } from '../../../utils/cn'

const SUMMARY_CARDS = [
  { key: 'totalFees', label: 'Total Fees', icon: IndianRupee, accent: 'from-[#55ace7] to-[#246392]' },
  { key: 'totalPaid', label: 'Total Paid', icon: CheckCircle2, accent: 'from-[#69df66] to-[#1a5c3a]' },
  { key: 'totalPending', label: 'Pending', icon: AlertCircle, accent: 'from-[#efb36d] to-[#b8887a]' },
  { key: 'activeEmiAmount', label: 'Active EMI', icon: TrendingUp, accent: 'from-[#55ace7] to-[#246392]', hideWhenZero: true },
  { key: 'scholarshipAmount', label: 'Scholarship', icon: Percent, accent: 'from-[#69df66] to-[#1a5c3a]' },
  { key: 'discountAmount', label: 'Discount', icon: Percent, accent: 'from-[#55ace7] to-[#69df66]' },
  { key: 'refundAmount', label: 'Refund', icon: IndianRupee, accent: 'from-[#df8284] to-[#b85c5e]' },
  { key: 'walletBalance', label: 'Wallet', icon: Wallet, accent: 'from-[#55ace7] to-[#246392]' },
]

const CARD_CLASS =
  'flex h-full flex-col !rounded-[12px] !p-4 shadow-[0_5px_20px_rgba(0,0,0,0.08)] hover:!translate-y-0 hover:!shadow-[0_5px_20px_rgba(0,0,0,0.08)]'

export default function ProfileSummaryOverview({ profile }) {
  if (!profile) return null
  const health = profile.health || {}
  const progress = profile.paymentProgress ?? 0

  const visibleCards = SUMMARY_CARDS.filter(({ key, hideWhenZero }) => {
    if (!hideWhenZero) return true
    return (profile[key] || 0) > 0
  })

  return (
    <div className="space-y-5">
      <div
        className={cn(
          'rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_rgba(0,0,0,0.08)]',
          health.ring || 'ring-slate-100',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Financial health</p>
            <p className="text-base font-bold text-[#111]">{health.label || '—'}</p>
          </div>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-sm',
              health.color || 'from-[#55ace7] to-[#246392]',
            )}
            aria-label={`${progress}% collected`}
          >
            {progress}%
          </div>
        </div>
        <div className="mt-2.5">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Collection progress</span>
            <span className="font-semibold tabular-nums text-[#111]">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-full bg-gradient-to-r transition-all duration-500',
                health.color || 'from-[#55ace7] to-[#246392]',
              )}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleCards.map(({ key, label, icon, accent }) => (
          <FinanceStatCard
            key={key}
            label={label}
            value={formatINR(profile[key] || 0)}
            icon={icon}
            accent={accent}
            className={CARD_CLASS}
          />
        ))}
      </div>
    </div>
  )
}
