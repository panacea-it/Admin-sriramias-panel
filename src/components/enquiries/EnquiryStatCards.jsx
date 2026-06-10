import { cn } from '../../utils/cn'

const cards = [
  {
    label: 'Total Enquiries',
    key: 'total',
    bg: 'bg-[#fce8ec]',
    valueClass: 'text-[#e85d7a] font-bold text-xl sm:text-2xl',
  },
  {
    label: 'New This Week',
    key: 'newThisWeek',
    bg: 'bg-[#e8f8eb]',
    valueClass: 'text-[#3dad4a] font-bold text-xl sm:text-2xl',
  },
  {
    label: 'Conversion Rate',
    key: 'conversionRate',
    bg: 'bg-[#fef9e6]',
    valueClass: 'text-[#c9a227] font-bold text-xl sm:text-2xl',
  },
  {
    label: 'Action Pending',
    key: 'actionPending',
    bg: 'bg-[#f0ebf8]',
    valueClass: 'text-[#8b5cf6] font-bold text-xl sm:text-2xl',
  },
]

export default function EnquiryStatCards({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {cards.map(({ label, key, bg, valueClass }) => (
        <div
          key={key}
          className={cn(
            'flex min-h-[72px] items-center justify-between rounded-xl px-4 py-3.5 shadow-[0_4px_12px_rgba(15,23,42,0.04)] sm:px-5 sm:py-4',
            bg,
          )}
        >
          <span className="text-sm font-semibold text-[#111] sm:text-base">{label}</span>
          <span className={valueClass}>
            {typeof stats[key] === 'number' ? stats[key].toLocaleString() : stats[key]}
          </span>
        </div>
      ))}
    </div>
  )
}
