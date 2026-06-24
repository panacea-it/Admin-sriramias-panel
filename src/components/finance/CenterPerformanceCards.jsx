import { motion } from 'framer-motion'
import { Award, TrendingUp, Clock, AlertTriangle, IndianRupee } from 'lucide-react'
import FinanceStatCard from './FinanceStatCard'
import { formatINR } from '../../utils/financeFilters'

const CARD_CONFIG = [
  { key: 'topRevenue', label: 'Top Revenue Center', icon: IndianRupee, format: (p) => p?.centerName },
  { key: 'bestPerforming', label: 'Best Performing Center', icon: Award, format: (p) => `${p?.centerName} (${p?.conversionPct}%)` },
  { key: 'lowestPending', label: 'Lowest Pending Center', icon: Clock, format: (p) => p?.centerName },
  { key: 'highestFailed', label: 'Highest Failed Payments', icon: AlertTriangle, format: (p) => p?.centerName, accent: 'from-[#df8284] to-[#b8887a]' },
  { key: 'fastestGrowing', label: 'Fastest Growing Center', icon: TrendingUp, format: (p) => `${p?.centerName} (+${p?.monthlyGrowth || 0}%)` },
]

export default function CenterPerformanceCards({ performance, loading }) {
  if (loading) return null
  if (!performance || Object.keys(performance).length === 0) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {CARD_CONFIG.map((cfg, i) => {
        const item = performance[cfg.key]
        if (!item) return null
        return (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <FinanceStatCard
              label={cfg.label}
              value={cfg.format(item)}
              sub={item.totalRevenue != null ? formatINR(item.totalRevenue) : undefined}
              icon={cfg.icon}
              accent={cfg.accent}
              className="backdrop-blur-sm bg-white/90"
            />
          </motion.div>
        )
      })}
    </div>
  )
}
