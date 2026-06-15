import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../../utils/cn'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import PaperEvaluationStatusBadge from '../evaluation-oversight/PaperEvaluationStatusBadge'
import AssignmentActionBar from './AssignmentActionBar'
import { formatRelativeTime } from '../../../utils/formatRelativeTime'

const TABLE_PAGINATION_CLASS = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Filter Status' },
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Overdue', label: 'Overdue' },
]

function StudentAvatar({ name }) {
  const initials = String(name || '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2fc] text-xs font-bold text-[#1a3a5c]">
      {initials || '—'}
    </span>
  )
}

function StatusFilterSelect({ value, onChange, disabled }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[150px]">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label="Filter status"
        className={cn(
          'h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base',
        )}
      >
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
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
  selectedCount,
  totalCount,
  onSelectAll,
  onCancel,
  onConfirm,
  saving,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'studentName',
        label: 'Student Name',
        width: '28%',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle',
        render: (row) => (
          <div className="flex min-w-0 items-center gap-2">
            <StudentAvatar name={row.studentName} />
            <span
              className="truncate font-semibold text-slate-900"
              title={row.studentName}
            >
              {row.studentName}
            </span>
          </div>
        ),
      },
      {
        key: 'rollNumber',
        label: 'Roll Number',
        width: '20%',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (row) => (
          <span className="text-[12px] font-medium text-[#686868]">
            {row.rollNumber || '—'}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Current Status',
        width: '24%',
        align: 'center',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap text-center',
        cellClassName: 'align-middle text-center',
        render: (row) => (
          <div className="flex w-full items-center justify-center">
            <PaperEvaluationStatusBadge status={row.status} />
          </div>
        ),
      },
      {
        key: 'lastUpdate',
        label: 'Last Update',
        width: '22%',
        align: 'center',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap text-center',
        cellClassName: 'whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-medium text-[#686868]">
            {formatRelativeTime(row.lastUpdate)}
          </span>
        ),
      },
    ],
    [],
  )

  const selection = useMemo(
    () => ({
      selectedIds,
      onToggle,
      onTogglePage: (_pageIds, select) => onToggleAll(select),
      getRowId: (row) => row.id,
      columnWidth: '6%',
    }),
    [selectedIds, onToggle, onToggleAll],
  )

  return (
    <div
      className={cn(
        'flex w-full max-w-full flex-col rounded-2xl border border-slate-200/70 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]',
        loading && 'opacity-60',
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#1a3a5c]">Student Paper Selection</h3>
          <p className="mt-0.5 text-xs font-medium text-[#686868]">
            Showing {papers.length} pending papers{testName ? ` for ${testName}` : ''}
          </p>
        </div>

        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
          <button
            type="button"
            onClick={onBulkSelectAll}
            disabled={loading || papers.length === 0}
            className="inline-flex h-10 min-h-[38px] items-center rounded-lg bg-[#eef2fc] px-4 text-sm font-semibold text-[#222] outline-none transition hover:bg-[#e5ebf9] focus:ring-2 focus:ring-[#55ace7] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
          >
            Bulk Action
          </button>
          <StatusFilterSelect
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="mt-5 w-full overflow-hidden rounded-xl border border-slate-100">
          <PaginatedFigmaTable
            className="w-full max-w-full"
            columns={columns}
            data={papers}
            loading={loading}
            emptyMessage="No pending papers for this selection."
            itemLabel="papers"
            initialPageSize={10}
            resetDeps={[statusFilter, papers.length, testName]}
            selection={selection}
            density="comfortable"
            rowClassName="hover:bg-[#eef6fc]/70"
            tableClassName="rounded-none border-0 shadow-none"
            tableMinWidth={640}
            tableLayoutFixed
            paginationClassName={TABLE_PAGINATION_CLASS}
          />
        </div>
      </div>

      <AssignmentActionBar
        selectedCount={selectedCount}
        totalCount={totalCount}
        onSelectAll={onSelectAll}
        onCancel={onCancel}
        onConfirm={onConfirm}
        saving={saving}
        mode="partial"
      />
    </div>
  )
}
