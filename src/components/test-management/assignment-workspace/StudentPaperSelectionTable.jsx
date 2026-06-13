import { cn } from '../../../utils/cn'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import PaperEvaluationStatusBadge from '../evaluation-oversight/PaperEvaluationStatusBadge'
import { formatRelativeTime } from '../../../utils/formatRelativeTime'

function StudentAvatar({ name }) {
  const initials = String(name || '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2fc] text-xs font-bold text-[#1a3a5c]">
      {initials}
    </span>
  )
}

export default function StudentPaperSelectionTable({
  papers,
  testName,
  selectedIds,
  onToggle,
  onToggleAll,
  statusFilter,
  onStatusFilterChange,
  onBulkSelectAll,
  loading,
}) {
  const columns = [
    {
      key: 'studentName',
      label: 'Student Name',
      render: (row) => (
        <span className="flex items-center gap-2 font-semibold text-[#1a3a5c]">
          <StudentAvatar name={row.studentName} />
          {row.studentName}
        </span>
      ),
    },
    {
      key: 'rollNumber',
      label: 'Roll Number',
      render: (row) => <span className="text-slate-500">{row.rollNumber}</span>,
    },
    {
      key: 'status',
      label: 'Current Status',
      render: (row) => <PaperEvaluationStatusBadge status={row.status} />,
    },
    {
      key: 'lastUpdate',
      label: 'Last Update',
      render: (row) => (
        <span className="italic text-slate-500">{formatRelativeTime(row.lastUpdate)}</span>
      ),
    },
  ]

  return (
    <article
      className={cn(
        'flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--card-shadow)]',
        loading && 'opacity-60',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-bold text-[#1a3a5c]">Student Paper Selection</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Showing {papers.length} pending papers{testName ? ` for ${testName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBulkSelectAll}
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-slate-50"
          >
            Bulk Action
          </button>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#1a3a5c] outline-none focus:ring-2 focus:ring-[#55ace7]/30"
          >
            <option value="all">Filter Status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-2 sm:p-3">
        <PaginatedFigmaTable
          columns={columns}
          data={papers}
          loading={loading}
          emptyMessage="No pending papers for this selection."
          itemLabel="papers"
          initialPageSize={10}
          stickyHeader
          rowClassName="hover:bg-slate-50/80"
          resetDeps={[statusFilter, papers.length, testName]}
          selection={{
            selectedIds,
            onToggle,
            onTogglePage: (pageIds, select) => onToggleAll(select),
            getRowId: (row) => row.id,
          }}
        />
      </div>
    </article>
  )
}
