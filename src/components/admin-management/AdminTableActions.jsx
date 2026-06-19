import { Ban, Eye, Pencil } from 'lucide-react'

const viewEditClassName =
  'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-[#246392]'

export default function AdminTableActions({ row, onView, onEdit, onStatusToggle, onDelete }) {
  const isActive = row.status === 'Active'

  return (
    <div className="flex flex-nowrap items-center justify-center gap-4 whitespace-nowrap">
      </div>
  )
}
