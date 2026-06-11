import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function ModalCloseButton({ onClick, className, disabled = false, 'aria-label': ariaLabel = 'Close' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full',
        'border border-white/20 bg-white text-[#246392]',
        'shadow-[0_4px_14px_rgba(15,23,42,0.15)]',
        'transition-all duration-200 hover:scale-105 hover:shadow-[0_6px_18px_rgba(15,23,42,0.2)] active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#246392]',
        disabled && 'cursor-not-allowed opacity-60 hover:scale-100',
        className,
      )}
    >
      <X className="h-5 w-5" strokeWidth={2.25} />
    </button>
  )
}
