import { Ban, Eye, Pencil } from 'lucide-react'
import { isRecordStatusActive } from '../../constants/recordStatus'

const viewEditClassName =
  'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-[#246392]'

export default function AdminTableActions({ row, onView, onEdit, onStatusToggle }) {
  const isActive = isRecordStatusActive(row.status)
  const displayName = row.fullName || row.employeeName || 'admin'

  return (
    <div className="flex flex-nowrap items-center justify-center gap-4 whitespace-nowrap">
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label={`View ${displayName}`}
        className={viewEditClassName}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        View
      </button>
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit ${displayName}`}
        className={viewEditClassName}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        Edit
      </button>
      <button
        type="button"
        onClick={onStatusToggle}
        title={isActive ? 'Disable' : 'Enable'}
        aria-label={isActive ? `Disable ${displayName}` : `Enable ${displayName}`}
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-amber-700 transition hover:text-amber-800"
      >
        <Ban className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        {isActive ? 'Disable' : 'Enable'}
      </button>
    </div>
  )
}
