import { Eye, Pencil, Plus, List } from 'lucide-react'
import AdminTooltip from './AdminTooltip'
import { cn } from '../../utils/cn'

function TableIconButton({ icon: Icon, label, onClick, variant = 'default' }) {
  const variants = {
    default: 'text-slate-600 hover:bg-slate-100 hover:text-[#246392]',
    view: 'text-[#246392] hover:bg-[#eef2fc] hover:text-[#1a3a5c]',
    edit: 'text-[#686868] hover:bg-slate-100 hover:text-[#1a3a5c]',
    add: 'text-white bg-gradient-to-r from-[#1a3a5c] to-[#03045e] hover:opacity-90 shadow-sm',
  }

  return (
    <AdminTooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150',
          'hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40 focus-visible:ring-offset-1',
          variants[variant] || variants.default,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </button>
    </AdminTooltip>
  )
}

/** Compact icon actions for Faculty Subjects listing table */
export function SubjectTableIconActions({ onAdd, onView, onViewList, onEdit }) {
  return (
    <div
      className="flex items-center justify-end gap-0.5"
      role="group"
      aria-label="Subject row actions"
    >
      <TableIconButton icon={Eye} label="View" onClick={onView} variant="view" />
      <TableIconButton icon={Pencil} label="Edit" onClick={onEdit} variant="edit" />
      <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden />
      <TableIconButton icon={Plus} label="Manage content" onClick={onAdd} variant="add" />
      <TableIconButton icon={List} label="View live class list" onClick={onViewList} variant="view" />
    </div>
  )
}

export function SubjectRowActions({ onAdd, onView, onViewList, onEdit }) {
  return (
    <div
      className="flex min-w-[200px] flex-nowrap items-center justify-center gap-1 sm:gap-1.5"
      role="group"
      aria-label="Subject row actions"
    >
      <TableIconButton icon={Plus} label="Add" onClick={onAdd} variant="add" />
      <TableIconButton icon={Eye} label="View" onClick={onView} variant="view" />
      <TableIconButton icon={List} label="View List" onClick={onViewList} variant="view" />
      <TableIconButton icon={Pencil} label="Edit" onClick={onEdit} variant="edit" />
    </div>
  )
}

export function TopicRowActions({ onEdit }) {
  return (
    <div className="flex flex-nowrap items-center justify-center gap-1.5">
      <TableIconButton icon={Pencil} label="Edit" onClick={onEdit} variant="edit" />
    </div>
  )
}
