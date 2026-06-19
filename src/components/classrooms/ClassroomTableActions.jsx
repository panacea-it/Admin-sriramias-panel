import { Ban, Eye, Pencil } from 'lucide-react'
import { cn } from '../../utils/cn'
import { normalizeClassroomStatus } from '../../utils/classroomsStorage'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function ClassroomTableActions({ row, onView, onEdit, onToggle, onDelete }) {
  const status = normalizeClassroomStatus(row.status)
  const isActive = status === 'Active'
  const label = row.name || row.code || 'classroom'

  return (
    <div className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5">
      </div>
  )
}
