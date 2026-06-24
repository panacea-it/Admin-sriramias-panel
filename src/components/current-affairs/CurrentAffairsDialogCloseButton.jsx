import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function CurrentAffairsDialogCloseButton({ onClick, className, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        'bg-white/15 text-white shadow-sm ring-1 ring-white/20',
        'transition-all duration-200 hover:bg-white/25 hover:scale-105 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#246392]',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      aria-label="Close"
    >
      <X className="h-5 w-5" strokeWidth={2.25} />
    </button>
  )
}
