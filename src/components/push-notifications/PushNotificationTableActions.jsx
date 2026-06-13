import { Pencil, Trash2 } from 'lucide-react'

const actionClassName =
  'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold transition'

export default function PushNotificationTableActions({ row, onEdit, onDelete }) {
  return (
    <div className="flex flex-nowrap items-center justify-center gap-4 whitespace-nowrap">
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit notification ${row.id}`}
        className={`${actionClassName} text-slate-500 hover:text-[#246392]`}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label={`Delete notification ${row.id}`}
        className={`${actionClassName} text-rose-600 hover:text-rose-700`}
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        Delete
      </button>
    </div>
  )
}
