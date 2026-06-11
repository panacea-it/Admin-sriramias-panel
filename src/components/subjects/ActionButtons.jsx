import { Eye, Pencil, Trash2, Plus, List } from 'lucide-react'
import { cn } from '../../utils/cn'

function IconTextAction({ label, onClick, className, icon: Icon, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      aria-label={title || label}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-1 py-1 text-sm font-medium transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#55ace7]/50',
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}

function TableIconButton({ icon: Icon, label, onClick, variant = 'default' }) {
  const variants = {
    default: 'text-slate-600 hover:bg-slate-100 hover:text-[#246392]',
    view: 'text-[#246392] hover:bg-[#eef2fc] hover:text-[#1a3a5c]',
    edit: 'text-[#686868] hover:bg-slate-100 hover:text-[#1a3a5c]',
    delete: 'text-[#c96565] hover:bg-red-50 hover:text-[#b91c1c]',
    add: 'text-white bg-gradient-to-r from-[#1a3a5c] to-[#03045e] hover:opacity-90 shadow-sm',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
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
  )
}

/** Compact icon actions for Faculty Subjects listing table */
export function SubjectTableIconActions({ onAdd, onView, onViewList, onEdit, onDelete }) {
  return (
    <div
      className="flex items-center justify-end gap-0.5"
      role="group"
      aria-label="Subject row actions"
    >
      <TableIconButton icon={Eye} label="View" onClick={onView} variant="view" />
      <TableIconButton icon={Pencil} label="Edit" onClick={onEdit} variant="edit" />
      <TableIconButton icon={Trash2} label="Delete" onClick={onDelete} variant="delete" />
      <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden />
      <TableIconButton
        icon={Plus}
        label="Manage content"
        onClick={onAdd}
        variant="add"
      />
      <TableIconButton icon={List} label="View live class list" onClick={onViewList} variant="view" />
    </div>
  )
}

export function SubjectRowActions({ onAdd, onView, onViewList, onEdit, onDelete }) {
  return (
    <div
      className="flex min-w-[280px] flex-nowrap items-center justify-center gap-2 sm:gap-2.5"
      role="group"
      aria-label="Subject row actions"
    >
      <button
        type="button"
        onClick={onAdd}
        title="Manage subject content (folders, topics, videos, tests)"
        aria-label="Add content"
        className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-2.5 text-xs font-semibold text-white shadow-sm transition hover:scale-[1.02] active:scale-[0.98] sm:px-3"
      >
        <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        <span className="whitespace-nowrap">Add</span>
      </button>
      <IconTextAction
        label="View"
        title="View subject details"
        onClick={onView}
        className="text-[#246392]"
        icon={Eye}
      />
      <IconTextAction
        label="View List"
        title="View live class list"
        onClick={onViewList}
        className="text-[#246392]"
        icon={List}
      />
      <IconTextAction
        label="Edit"
        title="Edit subject"
        onClick={onEdit}
        className="text-[#686868]"
        icon={Pencil}
      />
      <IconTextAction
        label="Delete"
        title="Delete subject"
        onClick={onDelete}
        className="text-[#c96565]"
        icon={Trash2}
      />
    </div>
  )
}

export function TopicRowActions({ onEdit, onDelete }) {
  return (
    <div className="flex flex-nowrap items-center justify-center gap-3">
      <IconTextAction
        label="Edit"
        onClick={onEdit}
        className="text-[#686868]"
        icon={Pencil}
      />
      <IconTextAction
        label="Delete"
        onClick={onDelete}
        className="text-[#c96565]"
        icon={Trash2}
      />
    </div>
  )
}
