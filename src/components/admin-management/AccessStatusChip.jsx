import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

const STYLES = {
  full: {
    chip: 'bg-emerald-500/10 text-emerald-800 ring-emerald-500/20',
    dot: 'bg-emerald-500',
    label: 'Full Access',
  },
  custom: {
    chip: 'bg-amber-500/10 text-amber-900 ring-amber-400/30',
    dot: 'bg-amber-500',
    label: 'Custom',
  },
  restricted: {
    chip: 'bg-rose-500/10 text-rose-700 ring-rose-400/25',
    dot: 'bg-rose-500',
    label: 'Restricted',
  },
}

function ChipContent({ cfg, compact }) {
  return (
    <>
      <span className={cn('shrink-0 rounded-full', cfg.dot, compact ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      <span className={cn('font-semibold', compact ? 'text-[10px]' : 'text-[11px]')}>{cfg.label}</span>
    </>
  )
}

/** Module-level RBAC badge for matrix cells. */
export default function AccessStatusChip({ status, disabled, compact, interactive = true, onPress }) {
  const key = STYLES[status] ? status : 'restricted'
  const cfg = STYLES[key]

  const cnBase = cn(
    'inline-flex items-center justify-center gap-1.5 rounded-full ring-1 ring-inset transition-all duration-200',
    cfg.chip,
    compact ? 'min-h-[30px] min-w-[5.5rem] px-2.5 py-1' : 'min-h-[34px] min-w-[6.5rem] px-3 py-1.5',
    disabled && interactive && 'cursor-default opacity-50',
    interactive && !disabled && 'cursor-pointer shadow-sm hover:-translate-y-px hover:shadow-md active:translate-y-0',
  )

  if (!interactive) {
    return (
      <span className={cnBase}>
        <ChipContent cfg={cfg} compact={compact} />
      </span>
    )
  }

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onPress?.()
      }}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={cnBase}
    >
      <ChipContent cfg={cfg} compact={compact} />
    </motion.button>
  )
}
