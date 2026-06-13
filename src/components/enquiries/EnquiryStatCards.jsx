import { cn } from '../../utils/cn'

const cards = [
  {
    label: 'Total Enquiries',
    key: 'total',
    valueColor: 'text-[#e85d7a]',
    accent: 'from-[#e85d7a] to-[#df8284]',
    bg: 'bg-gradient-to-br from-[#fff5f7] to-white',
  },
  {
    label: 'New This Week',
    key: 'newThisWeek',
    valueColor: 'text-[#3dad4a]',
    accent: 'from-[#3dad4a] to-[#2d8a38]',
    bg: 'bg-gradient-to-br from-[#f0fdf4] to-white',
  },
  {
    label: 'Conversion Rate',
    key: 'conversionRate',
    valueColor: 'text-[#c9a227]',
    accent: 'from-[#c9a227] to-[#b8921f]',
    bg: 'bg-gradient-to-br from-[#fffbeb] to-white',
  },
  {
    label: 'Action Pending',
    key: 'actionPending',
    valueColor: 'text-[#8b5cf6]',
    accent: 'from-[#8b5cf6] to-[#7c3aed]',
    bg: 'bg-gradient-to-br from-[#f5f3ff] to-white',
  },
]

export default function EnquiryStatCards({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {cards.map(({ label, key, valueColor, accent, bg }) => (
        <div
          key={key}
          className={cn(
            'relative min-h-[80px] overflow-hidden rounded-xl border border-slate-100/80 px-4 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:px-5 sm:py-4',
            bg,
          )}
        >
          <div
            className={cn(
              'absolute left-0 top-0 h-full w-1 bg-gradient-to-b',
              accent,
            )}
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
