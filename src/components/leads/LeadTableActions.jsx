import { Eye, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

function ActionIconButton({ icon: Icon, label, onClick, variant = 'default' }) {
  const variants = {
    view: 'bg-[#eef6fc] text-[#246392] hover:bg-[#55ace7]/15 hover:text-[#1a3a5c]',
    edit: 'bg-slate-100 text-[#686868] hover:bg-slate-200 hover:text-[#1a3a5c]',
    delete: 'bg-red-50 text-[#c96565] hover:bg-red-100 hover:text-[#b91c1c]',
    default: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
        'hover:scale-110 hover:shadow-sm active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40 focus-visible:ring-offset-1',
        variants[variant] || variants.default,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </button>
  )
}

export default function LeadTableActions({ onView, onEdit, onDelete }) {
  return (
    <div
      className="flex h-full min-h-[52px] items-center justify-center gap-2"
      role="group"
      aria-label="Lead row actions"
    >
      <ActionIconButton icon={Eye} label="View" onClick={onView} variant="view" />
      <ActionIconButton icon={Pencil} label="Edit" onClick={onEdit} variant="edit" />
      <ActionIconButton icon={Trash2} label="Delete" onClick={onDelete} variant="delete" />
    </div>
  )
}
