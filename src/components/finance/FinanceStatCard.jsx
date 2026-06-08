import { cn } from '../../utils/cn'

export default function FinanceStatCard({ label, value, sub, icon: Icon, accent = 'from-[#55ace7] to-[#246392]', className }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] sm:p-5',
        className,
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', accent)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#686868] sm:text-sm">{label}</p>
          <p className="mt-1 truncate text-xl font-bold text-[#111] sm:text-2xl">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-[#9ca0a8]">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white', accent)}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  )
}
