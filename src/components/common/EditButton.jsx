import { Edit3 } from 'lucide-react'
import { cn } from '../../utils/cn'

<<<<<<< HEAD
export default function EditButton({ onClick, className, label = 'Edit', disabled = false }) {
=======
export default function EditButton({ onClick, className, label = 'Edit' }) {
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
  return (
    <button
      type="button"
      onClick={onClick}
<<<<<<< HEAD
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium text-[#686868] transition hover:text-[#246392] disabled:cursor-not-allowed disabled:opacity-50 sm:text-base',
=======
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium text-[#686868] transition hover:text-[#246392] sm:text-base',
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
        className,
      )}
    >
      <Edit3 className="h-4 w-4" strokeWidth={2.35} aria-hidden />
      {label}
    </button>
  )
}
