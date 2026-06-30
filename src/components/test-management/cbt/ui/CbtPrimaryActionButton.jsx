import { Eye, MoreVertical } from 'lucide-react'
import { cn } from '../../../../utils/cn'

const ICONS = {
  eye: Eye,
  'more-vertical': MoreVertical,
}

export default function CbtPrimaryActionButton({
  label,
  onClick,
  disabled = false,
  icon = 'eye',
  className,
}) {
  const Icon = ICONS[icon] ?? Eye

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 min-h-[36px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1a3a5c] px-3.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(26,58,92,0.25)] transition hover:bg-[#152f4a] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm',
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
      <span>{label}</span>
    </button>
  )
}
