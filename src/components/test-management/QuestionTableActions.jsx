import { Ban, Copy, Eye, Pencil } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold transition'

export default function QuestionTableActions({
  row,
  onView,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}) {
  const isActive = row.status === 'Active'
  const rowLabel = row.id || 'question'

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-1.5">
      </div>
  )
}
