import { RefreshCw, Star, Trash2, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { isBlogActive } from '../../constants/blogManagementConstants'
import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'
import { recordStatusActionLabel } from '../../constants/recordStatus'

export default function BlogRowActions({
  title = 'blog',
  status,
  isMainBlog = false,
  loading = false,
  mainBlogLoading = false,
  deleteLoading = false,
  onView,
  onEdit,
  onStatusToggle,
  onToggleMainBlog,
  onDelete,
}) {
  const statusAction = recordStatusActionLabel(isBlogActive(status) ? 'Active' : 'In Active')
  const rowBusy = loading || mainBlogLoading || deleteLoading

  return (
    <div
      role="group"
      aria-label={`Actions for ${title}`}
      className={TABLE_ACTIONS_WRAP}
    >
      <ViewButton onClick={() => onView?.()} />
      <EditButton onClick={() => onEdit?.()} disabled={rowBusy} />
      <IconActionButton
        label={statusAction}
        onClick={() => onStatusToggle?.()}
        disabled={loading || deleteLoading}
        className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
      >
        <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
      <IconActionButton
        label={isMainBlog ? 'Remove main blog' : 'Set as main blog'}
        onClick={() => onToggleMainBlog?.()}
        disabled={mainBlogLoading || deleteLoading}
        className={cn(
          isMainBlog
            ? 'text-amber-700 hover:border-amber-200 hover:bg-amber-50'
            : 'text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-amber-600',
          mainBlogLoading && 'opacity-60',
        )}
      >
        <Star
          className={cn('h-[18px] w-[18px]', isMainBlog && 'fill-amber-500 text-amber-500')}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </IconActionButton>
      {onDelete ? (
        <IconActionButton
          label={`Delete ${title}`}
          onClick={() => onDelete?.()}
          disabled={deleteLoading || rowBusy}
          className={cn(
            'text-rose-600 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-700',
            deleteLoading && 'opacity-60',
          )}
        >
          {deleteLoading ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
          )}
        </IconActionButton>
      ) : null}
    </div>
  )
}
