import { motion } from 'framer-motion'
import { AlertTriangle, CalendarClock, IndianRupee, Percent, TrendingUp, Wallet } from 'lucide-react'
import { formatINR } from '../../../utils/financeFilters'
import { formatDisplayDate } from '../../../utils/emiSchedule'

const CARDS = [
  { key: 'totalEmiAmount', label: 'Total EMI', icon: IndianRupee, money: true },
  { key: 'paidEmi', label: 'Paid EMI', icon: TrendingUp, money: true, accent: 'text-emerald-700' },
  { key: 'pendingEmi', label: 'Pending EMI', icon: Wallet, money: true },
  { key: 'overdueEmi', label: 'Overdue EMI', icon: AlertTriangle, money: true, accent: 'text-[#dc2626]' },
  { key: 'nextDueDate', label: 'Next due date', icon: CalendarClock, date: true },
  { key: 'collectionPct', label: 'Collection %', icon: Percent, suffix: '%' },
]

export default function EmiPlanTrackingStrip({ analytics }) {
  if (!analytics) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
    >
      {CARDS.map(({ key, label, icon: Icon, money, date, suffix, accent }) => (
        <div
          key={key}
          className="rounded-xl border border-[#55ace7]/10 bg-gradient-to-br from-white to-[#f8fbff] px-3 py-3 shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
        >
          <div className="mb-1 flex items-center gap-1.5 text-[#246392]">
            <Icon className="h-3.5 w-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#686868]">{label}</p>
          </div>
          <p className={`text-base font-bold tabular-nums ${accent || 'text-[#111]'}`}>
            {date
              ? analytics[key]
                ? formatDisplayDate(analytics[key])
                : '—'
              : money
                ? formatINR(analytics[key])
                : `${analytics[key] ?? 0}${suffix || ''}`}
          </p>
        </div>
      ))}
    </motion.div>
  )
}
