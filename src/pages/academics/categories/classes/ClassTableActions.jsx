import { Ban, CheckCircle2, Eye, Pencil } from 'lucide-react'
import TableActionMenu from '../../../../components/common/TableActionMenu'
import { isRecordStatusActive, recordStatusActionLabel } from '../../../../constants/recordStatus'

export default function ClassTableActions({ row, onView, onEdit, onToggleStatus }) {
  const isActive = isRecordStatusActive(row.status)
  const statusAction = recordStatusActionLabel(row.status)

  const items = [
    { label: 'View', icon: Eye, onClick: () => onView?.(row) },
    { label: 'Edit', icon: Pencil, onClick: () => onEdit?.(row) },
    {
      label: statusAction,
      icon: isActive ? Ban : CheckCircle2,
      onClick: () => onToggleStatus?.(row),
    },
  ]

  return (
    <TableActionMenu
      items={items}
      triggerLabel={`Actions for ${row.name || 'class'}`}
      className="mx-auto"
    />
  )
}
