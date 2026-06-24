import { useMemo } from 'react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { cn } from '../../../utils/cn'
import { createActionsColumn } from '../../../utils/tableColumnHelpers'

const MAINS_TESTS_TABLE_MIN_WIDTH = 1500

const EVALUATION_STATUS_STYLES = {
  Completed: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  Evaluated: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  'In Progress': 'bg-sky-500/15 text-sky-800 ring-sky-500/25',
  'Under Review': 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  'Not Started': 'bg-slate-500/15 text-slate-600 ring-slate-400/25',
  Overdue: 'bg-red-500/15 text-red-800 ring-red-500/25',
}

function EvaluationStatusPill({ status }) {
  const label = status || 'Not Started'

  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] max-w-full items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        EVALUATION_STATUS_STYLES[label] ?? EVALUATION_STATUS_STYLES['Not Started'],
      )}
    >
      {label}
    </span>
  )
}

export default function MainsTestsManagementTable({
  tests,
  loading,
  resetDeps = [],
  emptyMessage,
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Test Name',
        width: '28%',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle',
        render: (row) => (
          <div className="min-w-0">
            <span
              className="block truncate font-semibold text-slate-900"
              title={row.title || ''}
            >
              {row.title || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'uploadedDate',
        label: 'Uploaded Date',
        width: '14%',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">{row.uploadedDate || '—'}</span>
        ),
      },
      {
        key: 'studentsAssigned',
        label: 'Students Assigned',
        width: '14%',
        align: 'center',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap text-center',
        cellClassName: 'whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">{row.studentsAssigned ?? 0}</span>
        ),
      },
      {
        key: 'studentsDownloaded',
        label: 'PDF Downloads',
        width: '12%',
        align: 'center',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap text-center',
        cellClassName: 'whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">{row.studentsDownloaded ?? 0}</span>
        ),
      },
      {
        key: 'studentsUploaded',
        label: 'Answer Sheets Uploaded',
        width: '16%',
        align: 'center',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap text-center',
        cellClassName: 'whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">{row.studentsUploaded ?? 0}</span>
        ),
      },
      {
        key: 'evaluationStatusLabel',
        label: 'Evaluation Status',
        width: '10%',
        align: 'center',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap text-center',
        cellClassName: 'align-middle text-center',
        render: (row) => (
          <div className="flex w-full items-center justify-center">
            <EvaluationStatusPill status={row.evaluationStatusLabel} />
          </div>
        ),
      },
      createActionsColumn({
        buttonCount: 1,
        align: 'center',
        render: (row) => renderActions(row),
      }),
    ],
    [renderActions],
  )

  return (
    <PaginatedFigmaTable
      className="w-full max-w-full"
      columns={columns}
      data={tests}
      emptyMessage={emptyMessage}
      itemLabel="tests"
      loading={loading}
      skeletonRowCount={8}
      initialPageSize={10}
      resetDeps={resetDeps}
      density="comfortable"
      zebraStriping
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={MAINS_TESTS_TABLE_MIN_WIDTH}
      tableLayoutFixed
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
