import { Pencil } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 shrink-0 items-center justify-center gap-0.5 rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition whitespace-nowrap sm:gap-1 sm:px-2 sm:text-xs'

function ActionBtn({ label, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(actionButtonClass, className)}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

export default function PushNotificationTableActions({ row, onEdit, onDelete }) {
  return (
    <div
      role="group"
      aria-label={`Actions for notification ${row.id}`}
      className="mx-auto flex w-max max-w-full flex-nowrap items-center justify-center gap-0.5 sm:gap-1"
    >
      </div>
  )
}
