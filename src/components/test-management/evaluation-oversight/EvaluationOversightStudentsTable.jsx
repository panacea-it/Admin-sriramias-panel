import { useMemo } from 'react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import PaperEvaluationStatusBadge from './PaperEvaluationStatusBadge'
import EvaluationOversightPaperActions from './EvaluationOversightPaperActions'
import { cn } from '../../../utils/cn'

const TABLE_PAGINATION_CLASS = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

function PriorityBadge({ priority }) {
  const label = priority || 'Normal'
  const styles = {
    Urgent: 'bg-red-500/15 text-red-800 ring-red-500/25',
    High: 'bg-orange-500/15 text-orange-800 ring-orange-500/25',
    Normal: 'bg-slate-500/15 text-slate-700 ring-slate-500/25',
    Low: 'bg-slate-400/10 text-slate-500 ring-slate-400/20',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        styles[label] ?? styles.Normal,
      )}
    >
      {label}
    </span>
  )
}

function MentorCell({ row }) {
  if (!row.mentorName) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium italic text-slate-500">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-[10px]">
          —
        </span>
        Unassigned
      </span>
    )
  }

  const initials =
    row.mentorInitials ||
    String(row.mentorName)
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-violet-50 px-2.5 py-1 text-[12px] font-semibold text-violet-800 ring-1 ring-violet-500/15"
      title={row.mentorName}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#55ace7] text-[10px] font-bold text-white">
        {initials}
      </span>
      <span>{row.mentorName}</span>
    </span>
  )
}

export default function EvaluationOversightStudentsTable({
  rows,
  loading,
  resetDeps = [],
  selection,
  emptyMessage = 'No papers match the selected filters.',
  emptyState,
  onViewPaper,
  onAssignEvaluator,
  onOpenEvaluation,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'studentName',
        label: 'Student Name',
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle',
        render: (row) => (
          <span className="font-semibold text-slate-900" title={row.studentName}>
            {row.studentName}
          </span>
        ),
      },
      {
        key: 'rollNumber',
        label: 'Roll Number',
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (row) => (
          <span className="text-[12px] font-medium text-[#686868]">{row.rollNumber || '—'}</span>
        ),
      },
      {
        key: 'testName',
        label: 'Test Name',
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle',
        render: (row) => (
          <span
            className="block text-[13px] font-medium text-[#111]"
            title={row.testName || ''}
          >
            {row.testName || '—'}
          </span>
        ),
      },
      {
        key: 'subjectName',
        label: 'Subject',
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle',
        render: (row) => (
          <span
            className="block text-[13px] font-medium text-[#111]"
            title={row.subjectName || ''}
          >
            {row.subjectName || '—'}
          </span>
        ),
      },
      {
        key: 'examType',
        label: 'Type',
        align: 'center',
        headerClassName: 'whitespace-nowrap text-center',
        cellClassName: 'whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {row.examType || '—'}
          </span>
        ),
      },
      {
        key: 'priority',
        label: 'Priority',
        align: 'center',
        headerClassName: 'whitespace-nowrap text-center',
        cellClassName: 'whitespace-nowrap align-middle text-center',
        render: (row) => <PriorityBadge priority={row.priority} />,
      },
      {
        key: 'centerName',
        label: 'Center',
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#111]" title={row.centerName || ''}>
            {row.centerName || '—'}
          </span>
        ),
      },
      {
        key: 'mentorName',
        label: 'Mentor Assigned',
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle',
        render: (row) => <MentorCell row={row} />,
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        headerClassName: 'whitespace-nowrap text-center',
        cellClassName: 'align-middle text-center',
        render: (row) => <PaperEvaluationStatusBadge status={row.status} />,
      },
      {
        key: 'scoreDisplay',
        label: 'Score',
        align: 'center',
        headerClassName: 'whitespace-nowrap text-center',
        cellClassName: 'whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span
            className={cn(
              'font-semibold tabular-nums',
              row.status === 'Evaluated' ? 'text-[#111]' : 'text-[#686868]',
            )}
          >
            {row.scoreDisplay}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        headerClassName: 'whitespace-nowrap px-4 text-center sm:px-6',
        cellClassName: 'whitespace-nowrap align-middle px-4 text-center sm:px-6',
        render: (row) => (
          <EvaluationOversightPaperActions
            row={row}
            onViewPaper={onViewPaper}
            onAssignEvaluator={onAssignEvaluator}
            onOpenEvaluation={onOpenEvaluation}
          />
        ),
      },
    ],
    [onViewPaper, onAssignEvaluator, onOpenEvaluation],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={rows}
      loading={loading}
      skeletonRowCount={8}
      emptyMessage={emptyMessage}
      emptyState={emptyState}
      itemLabel="records"
      initialPageSize={10}
      resetDeps={resetDeps}
      selection={selection}
      density="comfortable"
      zebraStriping
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={0}
      paginationClassName={TABLE_PAGINATION_CLASS}
    />
  )
}
