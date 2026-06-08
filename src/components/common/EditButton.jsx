import { Edit3 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function EditButton({ onClick, className, label = 'Edit' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium text-[#686868] transition hover:text-[#246392] sm:text-base',
        className,
      )}
    >
      <Edit3 className="h-4 w-4" strokeWidth={2.35} aria-hidden />
      {label}
    </button>
  )
}
