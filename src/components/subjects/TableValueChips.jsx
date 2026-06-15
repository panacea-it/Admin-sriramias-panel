import { cn } from '../../utils/cn'

const MAX_VISIBLE = 2

export default function TableValueChips({
  values = [],
  maxVisible = MAX_VISIBLE,
  emptyLabel = '—',
  moreLabel = 'more',
  className,
  variant = 'default',
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
  const isPill = variant === 'pill'

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)} title={list.join(', ')}>
      {visible.map((item) => (
        <span
          key={item}
          title={item}
          className={cn(
            'inline-flex max-w-[130px] truncate font-medium transition-colors',
            isPill
              ? 'rounded-full bg-gradient-to-r from-[#eef2fc] to-[#e8f4fc] px-2.5 py-1 text-xs text-[#246392] ring-1 ring-[#55ace7]/15 hover:from-[#e3eef9] hover:to-[#d9edf8] hover:ring-[#55ace7]/30'
              : 'rounded-md bg-[#e8f4fc] px-2 py-0.5 text-xs text-[#246392]',
          )}
        >
          {item}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'font-semibold text-[#246392]',
            isPill
              ? 'inline-flex items-center rounded-full bg-[#55ace7]/10 px-2 py-0.5 text-[11px] ring-1 ring-[#55ace7]/20'
              : 'text-xs',
          )}
          title={list.slice(maxVisible).join(', ')}
        >
          +{overflow} {moreLabel}
        </span>
      )}
    </div>
  )
}
