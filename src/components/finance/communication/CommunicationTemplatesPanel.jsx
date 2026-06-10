import { Plus, Pencil, Trash2 } from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import FinanceEmptyState from '../FinanceEmptyState'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import FinanceActionMenu from '../FinanceActionMenu'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function CommunicationTemplatesPanel({ templates = [], onAdd, onEdit, onDelete, canEdit }) {
  const columns = [
    { key: 'id', label: 'Template ID', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: 'name', label: 'Template Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'type', label: 'Type' },
    { key: 'channel', label: 'Channel' },
    { key: 'status', label: 'Status', render: (r) => <FinanceStatusBadge status={r.status} /> },
    { key: 'lastModified', label: 'Last Modified', render: (r) => formatCategoryDateTime(r.lastModified) },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        canEdit ? (
          <FinanceActionMenu
            actions={[
              { label: 'Edit', icon: Pencil, onClick: () => onEdit?.(row) },
              { label: 'Delete', icon: Trash2, onClick: () => onDelete?.(row), variant: 'danger' },
            ]}
          />
        ) : null,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#686868]">{templates.length} template(s)</p>
        {canEdit && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a3a5c]"
          >
            <Plus className="h-4 w-4" /> Add template
          </button>
        )}
      </div>
      {templates.length === 0 ? (
        <FinanceEmptyState title="No templates" description="Create communication templates for automated and manual messaging." />
      ) : (
        <PaginatedFigmaTable columns={columns} data={templates} itemLabel="templates" />
      )}
    </div>
  )
}
