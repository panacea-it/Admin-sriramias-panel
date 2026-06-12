import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, History } from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import FinanceEmptyState from '../FinanceEmptyState'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import FinanceTableRowActions from '../FinanceTableRowActions'
import FinanceTimeline from '../FinanceTimeline'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function CommunicationAutomationPanel({
  rules = [],
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  onViewLogs,
  selectedRule,
  canEdit,
}) {
  const columns = [
    { key: 'priority', label: 'Priority', render: (r) => <span className="font-mono text-xs">{r.priority}</span> },
    { key: 'name', label: 'Rule Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'triggerEvent', label: 'Trigger' },
    { key: 'triggerTiming', label: 'Timing' },
    { key: 'channel', label: 'Channel' },
    { key: 'templateName', label: 'Template' },
    {
      key: 'active',
      label: 'Status',
      render: (r) => (
        <button type="button" onClick={() => canEdit && onToggle?.(r)} className="inline-flex items-center gap-1">
          {r.active ? (
            <ToggleRight className="h-5 w-5 text-[#69df66]" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-[#686868]" />
          )}
          <FinanceStatusBadge status={r.active ? 'Active' : 'Inactive'} />
        </button>
      ),
    },
    {
      key: 'lastExecutedAt',
      label: 'Last run',
      render: (r) => (
        <div className="text-xs">
          <p>{r.lastExecutedAt ? formatCategoryDateTime(r.lastExecutedAt) : '—'}</p>
          {r.lastExecutionStatus && <FinanceStatusBadge status={r.lastExecutionStatus} />}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      headerClassName: 'text-right pr-6 sm:pr-8',
      cellClassName: 'text-right pr-6 sm:pr-8',
      render: (row) =>
        canEdit ? (
          <FinanceTableRowActions
            actions={[
              { label: 'Edit', icon: Pencil, onClick: () => onEdit?.(row) },
              { label: 'Logs', icon: History, onClick: () => onViewLogs?.(row) },
              { label: 'Delete', icon: Trash2, onClick: () => onDelete?.(row), variant: 'danger' },
            ]}
          />
        ) : null,
    },
  ]

  const logEvents = (selectedRule?.executionLogs || []).map((e) => ({
    step: e.status,
    detail: e.error || `${e.count ?? 0} message(s)`,
    timestamp: e.at,
    status: e.status === 'Failed' ? 'failed' : 'completed',
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#686868]">{rules.filter((r) => r.active).length} active · {rules.length} total</p>
        {canEdit && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a3a5c]"
          >
            <Plus className="h-4 w-4" /> Create rule
          </button>
        )}
      </div>
      {rules.length === 0 ? (
        <FinanceEmptyState title="No automation rules" description="Create rules to automate payment reminders and escalations." />
      ) : (
        <PaginatedFigmaTable columns={columns} data={rules} itemLabel="rules" />
      )}
      {selectedRule && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Execution logs — {selectedRule.name}</h3>
          {logEvents.length ? (
            <FinanceTimeline events={logEvents} />
          ) : (
            <p className="text-sm text-[#686868]">No execution logs yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
