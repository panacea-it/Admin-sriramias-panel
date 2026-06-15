import { Eye, List, Pencil, Plus, Trash2 } from 'lucide-react'
import TableActionMenu from '../common/TableActionMenu'

export default function SubjectRowActionsMenu({ onView, onEdit, onAdd, onViewList, onDelete }) {
  const menuItems = [
    { label: 'View', icon: Eye, onClick: onView },
    { label: 'Edit', icon: Pencil, onClick: onEdit },
    { label: 'Manage Content', icon: Plus, onClick: onAdd },
    { label: 'View List', icon: List, onClick: onViewList },
    { label: 'Delete', icon: Trash2, onClick: onDelete, danger: true },
  ]

  return (
    <div className="flex items-center justify-center">
      <TableActionMenu items={menuItems} triggerLabel="Subject actions" align="end" />
    </div>
  )
}
