import {
  Copy,
  Eye,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react'
import TableActionMenu from '../common/TableActionMenu'

export default function BatchTableActions({
  batch,
  onViewDetails,
  onQuickView,
  onEdit,
  onDuplicate,
  onDelete,
}) {
  const items = [
    {
      label: 'Batch Details',
      icon: Users,
      onClick: () => onViewDetails?.(batch),
    },
    {
      label: 'Quick View',
      icon: Eye,
      onClick: () => onQuickView?.(batch),
    },
    {
      label: 'Edit Batch',
      icon: Pencil,
      onClick: () => onEdit?.(batch),
    },
    {
      label: 'Duplicate Batch',
      icon: Copy,
      onClick: () => onDuplicate?.(batch),
    },
    {
      label: 'Delete Batch',
      icon: Trash2,
      onClick: () => onDelete?.(batch),
      danger: true,
    },
  ]

  return (
    <TableActionMenu
      items={items}
      triggerLabel={`Actions for ${batch.displayName || 'batch'}`}
    />
  )
}
