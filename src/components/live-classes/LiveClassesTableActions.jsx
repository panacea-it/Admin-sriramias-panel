import { Copy, Eye, Pencil, Power, Trash2 } from 'lucide-react'
import TableActionMenu from '../common/TableActionMenu'

export default function LiveClassesTableActions({
  row,
  onView,
  onEdit,
  onDelete,
  onDisable,
  onDuplicate,
}) {
  const items = [
    { label: 'View', icon: Eye, onClick: () => onView?.(row) },
    { label: 'Edit', icon: Pencil, onClick: () => onEdit?.(row) },
    { label: 'Duplicate', icon: Copy, onClick: () => onDuplicate?.(row) },
    {
      label: row.status === 'Disabled' ? 'Enable' : 'Disable',
      icon: Power,
      onClick: () => onDisable?.(row),
    },
    { label: 'Delete', icon: Trash2, onClick: () => onDelete?.(row), danger: true },
  ]

  return (
    <TableActionMenu
      items={items}
      triggerLabel={`Actions for ${row.lessonName || 'class'}`}
    />
  )
}
