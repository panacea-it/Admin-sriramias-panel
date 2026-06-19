import AdminTooltip from '../subjects/AdminTooltip'
import { cn } from '../../utils/cn'

export default function IconActionButton({
  label,
  onClick,
  disabled = false,
  className,
  children,
  placement = 'top',
}) {
  return (
    <AdminTooltip label={label} placement={placement}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent',
          'transition-all duration-150 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50 focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-45',
          className,
        )}
      >
        {children}
      </button>
    </AdminTooltip>
  )
}
