import { Ban, Eye, Pencil } from 'lucide-react'
import { cn } from '../../../utils/cn'

const viewEditClassName =
  'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-[#246392]'

export default function RoleTableActions({
  row,
  onView,
  onEdit,
  onStatusToggle,
  onDelete,
  canToggle = true,
  canDelete = true,
}) {
  const isActive = row.enabled

  return (
    <div className="flex flex-nowrap items-center justify-center gap-4 whitespace-nowrap">
      </div>
  )
}
