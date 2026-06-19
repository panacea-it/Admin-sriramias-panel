import { Ban, Eye, Pencil } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function ProductRowActions({
  name = 'product',
  status,
  loading = false,
  onView,
  onEdit,
  onStatusToggle,
  onDelete,
}) {
  const isActive = status === 'active'

  return (
    <div
      role="group"
      aria-label={`Actions for ${name}`}
      className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5"
    >
      </div>
  )
}
