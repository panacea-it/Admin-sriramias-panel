import { Eye, Pencil } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-xs font-semibold transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40 sm:h-9 sm:w-auto sm:min-w-[4.75rem] sm:px-2.5'

function ActionButton({ label, onClick, icon: Icon, className }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      title={label}
      aria-label={label}
      className={cn(actionButtonClass, className)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

export default function FreeLearningResourceRowActions({ onView, onEdit }) {
  return (
    <div className="inline-flex items-center justify-end gap-1.5 sm:gap-2">
      <ActionButton
        label="View"
        onClick={onView}
        icon={Eye}
        className="text-slate-500 hover:text-[#246392]"
      />
      <ActionButton
        label="Edit"
        onClick={onEdit}
        icon={Pencil}
        className="text-slate-500 hover:text-[#246392]"
      />
    </div>
  )
}
