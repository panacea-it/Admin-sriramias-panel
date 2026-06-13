import { cn } from '../../utils/cn'

const cards = [
  {
    label: 'Total Leads',
    key: 'total',
    valueColor: 'text-[#e85d7a]',
    accent: 'from-[#e85d7a] to-[#df8284]',
    bg: 'bg-gradient-to-br from-[#fff5f7] to-white',
  },
  {
    label: 'Conversion Rate',
    key: 'conversionRate',
    valueColor: 'text-[#c9a227]',
    accent: 'from-[#c9a227] to-[#b8921f]',
    bg: 'bg-gradient-to-br from-[#fffbeb] to-white',
  },
]

export default function LeadStatCards({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:max-w-2xl">
      {cards.map(({ label, key, valueColor, accent, bg }) => (
        <div
          key={key}
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-100/80 px-4 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:px-5 sm:py-4',
            bg,
          )}
        >
          <div
            className={cn('absolute left-0 top-0 h-full w-1 bg-gradient-to-b', accent)}
            aria-hidden
          />
          <div className="flex items-center justify-between gap-3 pl-2">
            <span className="text-sm font-semibold text-[#333] sm:text-base">{label}</span>
            <span className={cn('text-xl font-bold tabular-nums sm:text-2xl', valueColor)}>
              {typeof stats[key] === 'number' ? stats[key].toLocaleString() : stats[key]}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
