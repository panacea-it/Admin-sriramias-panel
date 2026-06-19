import { Ban, Eye, Pencil, Star } from 'lucide-react'
import { cn } from '../../utils/cn'
import { isBlogActive } from '../../constants/blogManagementConstants'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function BlogRowActions({
  title = 'blog',
  status,
  isMainBlog = false,
  loading = false,
  onView,
  onEdit,
  onStatusToggle,
  onToggleMainBlog,
  onDelete,
}) {
  const isActive = isBlogActive(status)

  return (
    <div
      role="group"
      aria-label={`Actions for ${title}`}
      className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5"
    >
      </div>
  )
}
