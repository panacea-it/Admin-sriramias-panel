import { cn } from '../../../../utils/cn'
import { CBT_CHART_CARD_CLASS } from './cbtUiConstants'

export default function CbtRankListCard({
  title,
  icon: Icon,
  iconClassName,
  items = [],
  emptyMessage = 'No records yet.',
  renderItem,
  itemClassName,
  className,
}) {
  return (
    <article className={cn(CBT_CHART_CARD_CLASS, className)}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a3a5c] sm:text-base">
        {Icon ? <Icon className={cn('h-4 w-4 shrink-0', iconClassName)} /> : null}
        {title}
      </h3>
      <ul className="max-h-[280px] space-y-2 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]">
        {items.length === 0 ? (
          <li className="text-sm text-slate-500">{emptyMessage}</li>
        ) : (
          items.map((item, index) => (
            <li
              key={item.id ?? index}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm',
                itemClassName,
              )}
            >
              {renderItem(item, index)}
            </li>
          ))
        )}
      </ul>
    </article>
  )
}
