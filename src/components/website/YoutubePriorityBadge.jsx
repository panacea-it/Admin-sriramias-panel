import { cn } from '../../utils/cn'
import { getRankBadgeClass, getRankLabel } from '../../utils/youtubeVideoPriority'

export default function YoutubePriorityBadge({ priorityOrder, priorityLevel, className, stacked }) {
  const order = priorityOrder ?? (priorityLevel > 0 ? priorityLevel : null)
  const label = getRankLabel(order)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold',
        getRankBadgeClass(order),
        stacked && 'max-w-full truncate',
        className,
      )}
      title={order ? `Priority rank #${order}` : 'Not ranked'}
    >
      {label}
    </span>
  )
}
