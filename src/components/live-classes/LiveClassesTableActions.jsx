import { Copy, Eye, Pencil, RefreshCw } from 'lucide-react'
import TableActionMenu from '../common/TableActionMenu'
import { recordStatusActionLabel } from '../../constants/recordStatus'

export default function LiveClassesTableActions({
  row,
  onView,
  onEdit,
  onDelete: _onDelete,
  onDisable,
  onDuplicate,
}) {
  const statusAction = recordStatusActionLabel(row.status === 'Disabled' ? 'In Active' : row.status)

  const items = [
    { label: 'View', icon: Eye, onClick: () => onView?.(row) },
    { label: 'Edit', icon: Pencil, onClick: () => onEdit?.(row) },
    { label: 'Duplicate', icon: Copy, onClick: () => onDuplicate?.(row) },
    {
      label: statusAction,
      icon: RefreshCw,
      onClick: () => onDisable?.(row),
    },
  ]

  return (
    <TableActionMenu
      items={items}
      triggerLabel={`Actions for ${row.lessonName || 'class'}`}
    />
  )
}
