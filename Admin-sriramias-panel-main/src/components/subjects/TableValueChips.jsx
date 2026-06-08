import { cn } from '../../utils/cn'

const MAX_VISIBLE = 2

export default function TableValueChips({
  values = [],
  maxVisible = MAX_VISIBLE,
  emptyLabel = '—',
  className,
}) {
  const list = Array.isArray(values)
    ? values.filter(Boolean)
    : typeof values === 'string' && values.trim()
      ? [values.trim()]
      : []

  if (!list.length) {
    return <span className="text-sm text-[#888]">{emptyLabel}</span>
  }

  const visible = list.slice(0, maxVisible)
  const overflow = list.length - visible.length

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)} title={list.join(', ')}>
      {visible.map((item) => (
        <span
          key={item}
          className="inline-flex max-w-[120px] truncate rounded-md bg-[#e8f4fc] px-2 py-0.5 text-xs font-medium text-[#246392]"
        >
          {item}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-xs font-semibold text-[#246392]">+{overflow} more</span>
      )}
    </div>
  )
}
