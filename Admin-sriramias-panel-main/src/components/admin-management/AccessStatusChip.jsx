import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

const STYLES = {
  full: {
    chip:
      'bg-emerald-500/12 text-emerald-800 ring-emerald-500/25',
    label: 'Full Access',
  },
  custom: {
    chip: 'bg-amber-500/12 text-amber-900 ring-amber-400/35',
    label: 'Custom',
  },
  restricted: {
    chip: 'bg-rose-500/10 text-rose-800 ring-rose-400/28',
    label: 'Restricted',
  },
}

/** Module-level RBAC badge for matrix cells. */
export default function AccessStatusChip({ status, disabled, compact, interactive = true, onPress }) {
  const key = STYLES[status] ? status : 'restricted'
  const cfg = STYLES[key]

  const cnBase = cn(
    'inline-flex min-h-[34px] min-w-[5.75rem] items-center justify-center rounded-full px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset transition-shadow duration-200',
    cfg.chip,
    disabled && interactive && 'cursor-default opacity-50',
    interactive && !disabled && 'cursor-pointer shadow-sm hover:shadow-md active:opacity-95',
    compact && 'min-h-[28px] min-w-[4.75rem] px-2 py-1 text-[10px]',
  )

  if (!interactive) {
    return (
      <motion.span layout className={cnBase}>
        {cfg.label}
      </motion.span>
    )
  }

  return (
    <motion.button
      type="button"
      layout
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onPress?.()
      }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={cnBase}
    >
      {cfg.label}
    </motion.button>
  )
}
