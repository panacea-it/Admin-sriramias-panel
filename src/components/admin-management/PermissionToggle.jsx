import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export default function PermissionToggle({
  allowed,
  onChange,
  disabled,
  size = 'md',
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!allowed)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40',
        size === 'sm' ? 'h-7 min-w-[72px] px-2.5 text-[10px]' : 'h-8 min-w-[84px] px-3 text-[11px]',
        allowed
          ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25'
          : 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/25 hover:bg-rose-500/20',
        disabled && 'cursor-not-allowed opacity-50',
      )}
      aria-pressed={allowed}
    >
      <motion.span
        layout
        className="mx-auto"
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {allowed ? 'Allowed' : 'Restricted'}
      </motion.span>
    </button>
  )
}
