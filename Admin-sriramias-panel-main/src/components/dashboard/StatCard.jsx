import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../../utils/cn'

const MiniChart = ({ color }) => (
  <svg width="72" height="40" viewBox="0 0 80 48" fill="none" className="hidden shrink-0 sm:block">
    <path
      d="M0 38 Q12 36 24 22 Q36 6 46 14 Q58 22 80 6"
      stroke={color}
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M0 38 Q12 36 24 22 Q36 6 46 14 Q58 22 80 6 L80 48 L0 48 Z"
      fill={`${color}22`}
    />
  </svg>
)

export default function StatCard({
  title,
  value,
  color,
  graphColor,
  icon: Icon,
  badge,
  badgeLabel,
  badgeDown,
}) {
  const chartColor = graphColor || color

  return (
    <article className="flex min-h-[120px] flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)] transition hover:shadow-md sm:min-h-[130px] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <MiniChart color={chartColor} />
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium text-[var(--color-text-muted)] sm:text-sm">{title}</p>
        <p className="mt-0.5 text-2xl font-black tracking-tight sm:text-[1.65rem]" style={{ color }}>
          {value}
        </p>
        {(badge || badgeLabel) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {badge && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:text-xs',
                  badgeDown ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700',
                )}
              >
                {badgeDown ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                {badge}
              </span>
            )}
            {badgeLabel && (
              <span className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">{badgeLabel}</span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
