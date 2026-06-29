import { Copy, Eye, FileQuestion, Pencil, Send, Undo2 } from 'lucide-react'
import TableActionMenu from '../../common/TableActionMenu'
import { createActionsColumn } from '../../../utils/tableColumnHelpers'

export function CbtTestTableActions({
  row,
  onView,
  onEdit,
  onPublish,
  onUnpublish,
  onDuplicate,
  onManageQuestions,
}) {
  const status = String(row.publishStatus || 'DRAFT').toUpperCase()
  const items = [
    { label: 'View', icon: Eye, onClick: onView },
    { label: 'Edit', icon: Pencil, onClick: onEdit },
    { label: 'Manage questions', icon: FileQuestion, onClick: onManageQuestions },
  ]

  if (status === 'DRAFT' || status === 'UNPUBLISHED') {
    items.push({ label: 'Publish', icon: Send, onClick: onPublish })
  }
  if (status === 'PUBLISHED') {
    items.push({ label: 'Unpublish', icon: Undo2, onClick: onUnpublish })
  }

  items.push({ label: 'Duplicate', icon: Copy, onClick: onDuplicate })

  return <TableActionMenu triggerLabel={`Actions for ${row.testName}`} items={items} className="mx-auto" />
}

export function createCbtTestActionsColumn(render) {
  return createActionsColumn({
    buttonCount: 1,
    align: 'center',
    width: 72,
    render,
  })
}
