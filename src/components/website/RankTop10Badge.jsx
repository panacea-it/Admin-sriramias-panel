import { cn } from '../../utils/cn'

export default function RankTop10Badge({ size = 'default', className }) {
  const compact = size === 'sm'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full font-bold uppercase tracking-wide text-white',
        'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500',
        'shadow-[0_2px_10px_rgba(245,158,11,0.35)] ring-1 ring-inset ring-white/35',
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]',
        className,
      )}
    >
      <span aria-hidden className={compact ? 'text-[10px]' : 'text-xs'}>
        🏆
      </span>
      Top 10
    </span>
  )
}
