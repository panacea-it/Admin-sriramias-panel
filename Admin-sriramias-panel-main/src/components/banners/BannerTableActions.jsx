import { Eye, Trash2 } from 'lucide-react'
import EditButton from '../common/EditButton'
import { cn } from '../../utils/cn'

export default function BannerTableActions({ onEdit, onDelete, onPreview, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 sm:gap-4', className)}>
      <EditButton onClick={onEdit} />
      <button
        type="button"
        onClick={onPreview}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#246392] transition hover:text-[#1a4d6e] sm:text-base"
      >
        <Eye className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        Preview
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c96565] transition hover:text-[#b94b4b] sm:text-base"
      >
        <Trash2 className="h-4 w-4" strokeWidth={2.1} aria-hidden />
        Delete
      </button>
    </div>
  )
}
