import { Eye } from 'lucide-react'
import EditButton from '../common/EditButton'
import { cn } from '../../utils/cn'

export default function BannerTableActions({ onEdit, onDelete, onPreview, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 sm:gap-4', className)}>
      <EditButton onClick={onEdit} />
      </div>
  )
}
