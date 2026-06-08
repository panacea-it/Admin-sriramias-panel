import { cn } from '../../utils/cn'

export default function FinanceSettingsHeader({
  title,
  subtitle,
  stats,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3 sm:px-5 sm:py-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1a3a5c] sm:text-lg">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[#686868] sm:text-sm">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {stats && (
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef6fc] px-2.5 py-1 text-xs font-semibold text-[#246392]"
            >
              <span className="tabular-nums">{stat.value}</span>
              <span className="font-medium text-[#686868]">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function FinanceSettingsSection({ title, count, children, className }) {
  return (
    <section className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 px-0.5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#246392]">{title}</h3>
        {count != null && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-[#686868]">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
