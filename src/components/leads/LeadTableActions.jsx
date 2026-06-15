import { Eye, Pencil, Trash2 } from 'lucide-react'
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

export default function LeadTableActions({ onView, onEdit, onDelete }) {
  return (
    <div
      role="group"
      aria-label="Lead row actions"
      className="mx-auto flex w-max max-w-full flex-nowrap items-center justify-center gap-0.5 sm:gap-1"
    >
      <ActionBtn
        label="View"
        onClick={onView}
        className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
      </ActionBtn>
      <ActionBtn
        label="Edit"
        onClick={onEdit}
        className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
      </ActionBtn>
      <ActionBtn
        label="Delete"
        onClick={onDelete}
        className="text-[#c96565] hover:bg-red-50 hover:text-[#b94b4b]"
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
      </ActionBtn>
    </div>
  )
}
