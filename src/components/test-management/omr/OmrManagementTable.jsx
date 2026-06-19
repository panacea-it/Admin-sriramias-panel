import { useMemo } from 'react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

function StatusPill({ status }) {
  const active = status === 'Active'
  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        active
          ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
          : 'bg-slate-200/80 text-slate-700 ring-slate-300/50',
      )}
    >
      {active ? 'Active' : 'Deactivated'}
    </span>
  )
}

function ResultSheetPill({ value }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        value
          ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
          : 'bg-slate-200/80 text-slate-700 ring-slate-300/50',
      )}
    >
      {value ? 'Yes' : 'No'}
    </span>
  )
}

function formatExamDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function OmrManagementTable({
  exams,
  loading,
  resetDeps = [],
  emptyMessage,
  emptyState,
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'examName',
        label: 'Name',
        headerClassName: 'min-w-[180px]',
        cellClassName: 'min-w-[180px] align-middle',
        render: (row) => (
          <span
            className="block truncate font-semibold text-slate-900"
            title={row.examName || ''}
          >
            {row.examName || '—'}
          </span>
        ),
      },
      {
        key: 'examDate',
        label: 'Exam Date',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#111]">{formatExamDate(row.examDate)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle',
        render: (row) => <StatusPill status={row.status} />,
      },
      {
        key: 'resultSheetUploaded',
        label: 'Result Sheet',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle',
        render: (row) => <ResultSheetPill value={row.resultSheetUploaded} />,
      },
      {
        key: 'uploadDate',
        label: 'Upload Date',
        headerClassName: 'min-w-[150px] whitespace-nowrap',
        cellClassName: 'min-w-[150px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">
            {row.resultSheet?.uploadedAt
              ? formatCategoryDateTime(row.resultSheet.uploadedAt)
              : '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        headerClassName: 'min-w-[150px] whitespace-nowrap',
        cellClassName: 'min-w-[150px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">
            {row.createdAt ? formatCategoryDateTime(row.createdAt) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[220px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[220px] whitespace-nowrap align-middle pr-4 sm:pr-6',
        render: (row) => renderActions(row),
      },
    ],
    [renderActions],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={exams}
      emptyMessage={emptyMessage}
      emptyState={emptyState}
      itemLabel="OMR exams"
      loading={loading}
      skeletonRowCount={8}
      resetDeps={resetDeps}
      density="comfortable"
      zebraStriping
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={960}
      paginationClassName={cn(
        '[&>div:last-child]:items-center',
        '[&_nav]:items-center',
        '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
        '[&_form_input]:h-9 [&_form_input]:leading-none',
        '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
      )}
    />
  )
}
