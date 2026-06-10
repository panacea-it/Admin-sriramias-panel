import { Ban, Eye, Pencil, Trash2 } from 'lucide-react'

const viewEditClassName =
  'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-[#246392]'

export default function AdminTableActions({ row, onView, onEdit, onStatusToggle, onDelete }) {
  const isActive = row.status === 'Active'

  return (
    <div className="flex flex-nowrap items-center justify-center gap-4 whitespace-nowrap">
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label={`View ${row.employeeName}`}
        className={viewEditClassName}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        View
      </button>
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit ${row.employeeName}`}
        className={viewEditClassName}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        Edit
      </button>
      <button
        type="button"
        onClick={onStatusToggle}
        title={isActive ? 'Disable' : 'Enable'}
        aria-label={isActive ? `Disable ${row.employeeName}` : `Enable ${row.employeeName}`}
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-amber-700 transition hover:text-amber-800"
      >
        <Ban className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        {isActive ? 'Disable' : 'Enable'}
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label={`Delete ${row.employeeName}`}
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-rose-600 transition hover:text-rose-700"
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        Delete
      </button>
    </div>
  )
}
