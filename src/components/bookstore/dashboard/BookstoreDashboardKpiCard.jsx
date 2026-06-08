import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { cn } from '../../../utils/cn'

export default function BookstoreDashboardKpiCard({
  label,
  value,
  icon: Icon,
  trend,
  sparkData = [],
  accent = 'from-[#7c5cbf] via-[#6a4fb0] to-[#4a3d8f]',
  delay = 0,
  sparkId = 'kpi',
}) {
  const up = trend?.up
  const chartData = sparkData.map((v, i) => ({ i, v }))
  const gradId = `spark-${sparkId}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-4 shadow-[0_12px_32px_rgba(74,61,143,0.15)] sm:p-5',
        'bg-gradient-to-br text-white backdrop-blur-sm',
        accent,
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/80">{label}</p>
          <p className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
          {trend && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-white/90">
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {up ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-md">
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </div>
        )}
      </div>

      {chartData.length > 1 && (
        <div className="relative mt-3 h-10 w-full opacity-90">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#ffffff"
                strokeWidth={1.5}
                fill={`url(#${gradId})`}
                dot={false}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}
