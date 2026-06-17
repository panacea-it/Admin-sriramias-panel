import { Ban, Eye, Pencil, Star, Trash2 } from 'lucide-react'
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
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onView?.()
        }}
        title="View"
        aria-label={`View ${title}`}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">View</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onEdit?.()
        }}
        title="Edit"
        aria-label={`Edit ${title}`}
        disabled={loading}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
          loading && 'opacity-60',
        )}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Edit</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onStatusToggle?.()
        }}
        title={isActive ? 'Disable' : 'Enable'}
        aria-label={isActive ? `Disable ${title}` : `Enable ${title}`}
        disabled={loading}
        className={cn(actionButtonClass, 'text-amber-700 hover:bg-amber-50', loading && 'opacity-60')}
      >
        <Ban className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{isActive ? 'Disable' : 'Enable'}</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleMainBlog?.()
        }}
        title={isMainBlog ? 'Remove Main Blog' : 'Mark as Main Blog'}
        aria-label={
          isMainBlog ? `Remove Main Blog from ${title}` : `Mark ${title} as Main Blog`
        }
        className={cn(
          actionButtonClass,
          isMainBlog
            ? 'bg-violet-50 text-violet-700 hover:bg-violet-100'
            : 'text-[#686868] hover:bg-slate-100 hover:text-violet-600',
        )}
      >
        <Star
          className={cn('h-3.5 w-3.5 shrink-0', isMainBlog && 'fill-violet-500 text-violet-500')}
        />
        <span className="hidden lg:inline">Main</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete?.()
        }}
        title="Delete"
        aria-label={`Delete ${title}`}
        className={cn(
          actionButtonClass,
          'text-[#c96565] hover:bg-red-50 hover:text-[#b94b4b]',
        )}
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Delete</span>
      </button>
    </div>
  )
}
