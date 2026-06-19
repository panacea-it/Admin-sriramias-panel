import { Eye } from 'lucide-react'
import EditButton from '../common/EditButton'
import IconActionButton from '../common/IconActionButton'
import { cn } from '../../utils/cn'

export default function BannerTableActions({ onEdit, onDelete: _onDelete, onPreview, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5 sm:gap-2', className)}>
      <EditButton onClick={onEdit} />
      <IconActionButton
        label="Preview"
        onClick={onPreview}
        className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
      >
        <Eye className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </IconActionButton>
    </div>
  )
}
