import MiniSparkline from './charts/MiniSparkline'
import MiniBarChart from './charts/MiniBarChart'

export default function DashboardStatCard({
  title,
  value,
  color,
  graphColor,
  icon: Icon,
  badge,
  badgeLabel,
  badgeDown,
  chartType = 'sparkline',
}) {
  const chart = graphColor || color

  return (
    <article className="relative flex min-h-[148px] flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:min-h-[156px] sm:p-5">
      <div className="mb-3 flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
          style={{ background: `${color}18` }}
        >
          <Icon size={20} style={{ color }} strokeWidth={2.2} />
        </div>
        <p className="pt-1 text-sm font-semibold leading-snug text-gray-500">{title}</p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p
            className="text-2xl font-extrabold leading-none sm:text-3xl lg:text-[2rem]"
            style={{ color }}
          >
            {value}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span
              className="rounded-lg px-2.5 py-1 text-xs font-bold"
              style={{
                background: badgeDown ? '#fde8e8' : '#e7f7e8',
                color: badgeDown ? '#e53e3e' : '#276749',
              }}
            >
              {badge}
            </span>
            <span className="text-xs font-semibold text-gray-500">{badgeLabel}</span>
          </div>
        </div>
        {chartType === 'bar' ? (
          <MiniBarChart color={chart} className="hidden sm:block" />
        ) : (
          <MiniSparkline color={chart} className="hidden sm:block" />
        )}
      </div>
    </article>
  )
}
