import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import AdminTooltip from './AdminTooltip'

function ActionIconButton({ icon: Icon, label, onClick, variant = 'edit' }) {
  const variants = {
    edit: 'text-[#686868] hover:bg-slate-100 hover:text-[#1a3a5c] border-slate-200/80',
    delete: 'text-[#c96565] hover:bg-red-50 hover:text-[#b91c1c] border-red-200/60',
  }

  return (
    <AdminTooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border bg-white shadow-sm',
          'transition-all duration-150 hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40 focus-visible:ring-offset-1',
          variants[variant] || variants.edit,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </button>
    </AdminTooltip>
  )
}

export default function TopicRowActionsMenu({ onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <ActionIconButton icon={Pencil} label="Edit" onClick={onEdit} variant="edit" />
      <ActionIconButton icon={Trash2} label="Delete" onClick={onDelete} variant="delete" />
    </div>
  )
}
