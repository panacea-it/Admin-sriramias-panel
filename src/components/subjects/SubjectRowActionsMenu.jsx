import { Eye, Pencil, Plus, Trash2, List } from 'lucide-react'
import { cn } from '../../utils/cn'
import TableActionMenu, { tableActionsCellClass } from '../common/TableActionMenu'
import AdminTooltip from './AdminTooltip'

function QuickIconButton({ icon: Icon, label, onClick, variant = 'default' }) {
  const variants = {
    view: 'text-[#246392] hover:bg-[#eef2fc] hover:text-[#1a3a5c] border-slate-200/80',
    edit: 'text-[#686868] hover:bg-slate-100 hover:text-[#1a3a5c] border-slate-200/80',
  }

  return (
    <AdminTooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border bg-white shadow-sm',
          'transition-all duration-150 hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40 focus-visible:ring-offset-1',
          variants[variant] || variants.view,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </button>
    </AdminTooltip>
  )
}

export default function SubjectRowActionsMenu({ onView, onEdit, onAdd, onViewList, onDelete }) {
  const menuItems = [
    { label: 'View', icon: Eye, onClick: onView },
    { label: 'Edit', icon: Pencil, onClick: onEdit },
    { label: 'Manage Content', icon: Plus, onClick: onAdd },
    { label: 'View Live Class List', icon: List, onClick: onViewList },
    { label: 'Delete', icon: Trash2, onClick: onDelete, danger: true },
  ]

  return (
    <div className="flex items-center justify-end gap-1">
      <QuickIconButton icon={Eye} label="View" onClick={onView} variant="view" />
      <QuickIconButton icon={Pencil} label="Edit" onClick={onEdit} variant="edit" />
      <TableActionMenu items={menuItems} triggerLabel="More actions" align="end" />
    </div>
  )
}

export { tableActionsCellClass }
