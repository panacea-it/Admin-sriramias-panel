import { formatINR } from '../../../utils/financeFilters'
import { cn } from '../../../utils/cn'

function ChartCard({ title, subtitle, children, className }) {
  return (
    <div className={cn('overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]', className)}>
      <div className="bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-3 sm:px-5">
        <h3 className="text-sm font-bold text-white sm:text-base">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-white/80">{subtitle}</p>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

export function RetryConversionTrendChart({ retryRows = [], className }) {
  const buckets = ['0 retries', '1 retry', '2 retries', '3+ retries']
  const counts = buckets.map((_, i) =>
    retryRows.filter((r) => (i < 3 ? r.retryCount === i : r.retryCount >= 3)).length,
  )
  const max = Math.max(...counts, 1)

  return (
    <ChartCard title="Retry trend" subtitle="Attempts before success" className={className}>
      <div className="flex h-36 items-end justify-between gap-2">
        {buckets.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-semibold text-[#246392]">{counts[i]}</span>
            <div
              className="w-full rounded-t bg-gradient-to-t from-[#246392] to-[#55ace7]"
              style={{ height: `${Math.max((counts[i] / max) * 100, 8)}%`, minHeight: '0.5rem' }}
            />
            <span className="text-[10px] text-[#686868]">{label}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

export function RecoveryFunnelChart({ funnel = [], className }) {
  const max = Math.max(...funnel.map((f) => f.count), 1)
  if (!funnel.length) {
    return (
      <ChartCard title="Recovery funnel" subtitle="Failed → recovered journey" className={className}>
        <p className="py-8 text-center text-sm text-[#686868]">No funnel data</p>
      </ChartCard>
    )
  }
  return (
    <ChartCard title="Recovery funnel" subtitle="Failed → recovered journey" className={className}>
      <ul className="space-y-3">
        {funnel.map((step) => {
          const pct = Math.round((step.count / max) * 100)
          return (
            <li key={step.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-[#222]">{step.label}</span>
                <span className="font-bold text-[#246392]">{step.count}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#eef2fc]">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: step.color }} />
              </div>
            </li>
          )
        })}
      </ul>
    </ChartCard>
  )
}

export function RecoveryHeatmapChart({ trend = [], className }) {
  const max = Math.max(...trend.map((t) => t.revenue || 0), 1)
  return (
    <ChartCard title="Revenue recovery trend" subtitle="Monthly recovered revenue" className={className}>
      <div className="grid grid-cols-5 gap-2">
        {trend.map((t) => {
          const intensity = (t.revenue || 0) / max
          return (
            <div key={t.month} className="text-center">
              <div
                className="mx-auto mb-1 flex h-12 w-full items-center justify-center rounded-lg text-[10px] font-bold text-white"
                style={{ backgroundColor: `rgba(36, 99, 146, ${0.2 + intensity * 0.8})` }}
                title={formatINR(t.revenue)}
              >
                {t.recovered}
              </div>
              <span className="text-[10px] text-[#686868]">{t.month}</span>
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}
