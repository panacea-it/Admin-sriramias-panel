import { motion } from 'framer-motion'
import { formatINR } from '../../../utils/financeFilters'

const CARDS = [
  { key: 'totalPlans', label: 'Total EMI Plans' },
  { key: 'active', label: 'Active EMIs' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'collectionPct', label: 'Collection %', suffix: '%' },
  { key: 'pendingCollections', label: 'Pending Collections', money: true },
]

export default function EmiAnalyticsStrip({ analytics }) {
  if (!analytics) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
    >
      {CARDS.map(({ key, label, suffix, money }) => (
        <div
          key={key}
          className="rounded-lg border border-slate-100 bg-white px-3 py-2.5 shadow-sm"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#686868]">{label}</p>
          <p className="mt-0.5 text-base font-bold tabular-nums text-[#246392]">
            {money
              ? formatINR(analytics[key])
              : `${analytics[key] ?? 0}${suffix || ''}`}
          </p>
        </div>
      ))}
    </motion.div>
  )
}
