import { useMemo } from 'react'
import { Eye, PlayCircle, UserPlus } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import TableActionMenu from '../../common/TableActionMenu'
import PaperEvaluationStatusBadge from './PaperEvaluationStatusBadge'
import { cn } from '../../../utils/cn'

const ACTIONS_HEADER_CLASS =
  'w-[88px] min-w-[88px] max-w-[88px] whitespace-nowrap px-3 text-center align-middle'

const ACTIONS_CELL_CLASS =
  'w-[88px] min-w-[88px] max-w-[88px] whitespace-nowrap px-3 py-0 align-middle text-center'

const TABLE_SCROLL_CLASS = cn(
  'rounded-none border-0 shadow-none',
  'overflow-x-auto overscroll-x-contain scroll-smooth [-webkit-overflow-scrolling:touch]',
  '[scrollbar-gutter:stable]',
  '[&_table]:table-fixed [&_table]:w-full',
  '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap',
  '[&_tbody_td]:align-middle',
  '[&_thead_th:last-child]:sticky [&_thead_th:last-child]:right-0 [&_thead_th:last-child]:z-[21]',
  '[&_thead_th:last-child]:!bg-[#246392] [&_thead_th:last-child]:shadow-[-6px_0_12px_rgba(15,23,42,0.1)]',
  '[&_thead_th:last-child]:border-l [&_thead_th:last-child]:border-white/20',
  '[&_tbody_td:last-child]:sticky [&_tbody_td:last-child]:right-0 [&_tbody_td:last-child]:z-[2]',
  '[&_tbody_td:last-child]:!bg-white [&_tbody_td:last-child]:shadow-[-6px_0_12px_rgba(15,23,42,0.08)]',
  '[&_tbody_td:last-child]:border-l [&_tbody_td:last-child]:border-slate-100',
  '[&_tbody_tr:hover_td:last-child]:!bg-[#eef6fc]',
)

function MentorCell({ row }) {
  if (!row.mentorName) {
    return (
      <span className="inline-flex items-center gap-2 italic text-slate-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-300 text-[10px]">
          —
        </span>
        Unassigned
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: '#55ace7' }}
      >
        {row.mentorInitials || row.mentorName.slice(0, 2)}
      </span>
      <span className="font-medium text-[#333]">{row.mentorName}</span>
    </span>
  )
}

export default function EvaluationOversightStudentsTable({
  rows,
  loading,
  resetDeps = [],
  onViewPaper,
  onAssignEvaluator,
  onOpenEvaluation,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'studentName',
        label: 'Student Name',
        headerClassName: 'min-w-[150px] w-[150px]',
        cellClassName: 'min-w-[150px] w-[150px]',
        render: (r) => <span className="font-semibold text-[#1a3a5c]">{r.studentName}</span>,
      },
      {
        key: 'rollNumber',
        label: 'Roll Number',
        headerClassName: 'min-w-[120px] w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] w-[120px] whitespace-nowrap',
        render: (r) => <span className="text-slate-500">{r.rollNumber}</span>,
      },
      {
        key: 'testName',
        label: 'Test Name',
        headerClassName: 'min-w-[160px] w-[160px]',
        cellClassName: 'min-w-[160px] w-[160px]',
        render: (r) => <span className="font-medium text-[#333]">{r.testName}</span>,
      },
      {
        key: 'subjectName',
        label: 'Subject',
        headerClassName: 'min-w-[140px] w-[140px]',
        cellClassName: 'min-w-[140px] w-[140px]',
        render: (r) => <span className="font-medium text-[#333]">{r.subjectName}</span>,
      },
      {
        key: 'priority',
        label: 'Priority',
        headerClassName: 'min-w-[90px] w-[90px] whitespace-nowrap',
        cellClassName: 'min-w-[90px] w-[90px] whitespace-nowrap',
        render: (r) => (
          <span
            className={cn(
              'text-xs font-bold',
              r.priority === 'High' && 'text-red-600',
              r.priority === 'Normal' && 'text-slate-600',
              r.priority === 'Low' && 'text-slate-400',
            )}
          >
            {r.priority || 'Normal'}
          </span>
        ),
      },
      {
        key: 'centerName',
        label: 'Center',
        headerClassName: 'min-w-[130px] w-[130px]',
        cellClassName: 'min-w-[130px] w-[130px]',
        render: (r) => <span className="text-xs text-slate-600">{r.centerName}</span>,
      },
      {
        key: 'mentorName',
        label: 'Mentor Assigned',
        headerClassName: 'min-w-[170px] w-[170px]',
        cellClassName: 'min-w-[170px] w-[170px]',
        render: (r) => <MentorCell row={r} />,
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[120px] w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] w-[120px] whitespace-nowrap',
        render: (r) => <PaperEvaluationStatusBadge status={r.status} />,
      },
      {
        key: 'scoreDisplay',
        label: 'Score',
        align: 'center',
        headerClassName: 'min-w-[80px] w-[80px] whitespace-nowrap',
        cellClassName: 'min-w-[80px] w-[80px] whitespace-nowrap',
        render: (r) => (
          <span
            className={cn(
              'font-bold',
              r.status === 'Evaluated' ? 'text-[#1a3a5c]' : 'text-slate-500',
            )}
          >
            {r.scoreDisplay}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        headerClassName: ACTIONS_HEADER_CLASS,
        cellClassName: ACTIONS_CELL_CLASS,
        render: (row) => (
          <div className="flex w-full items-center justify-center">
            <TableActionMenu
              triggerLabel="Paper actions"
              className="mx-auto shrink-0"
              menuWidth={220}
              items={[
                {
                  label: 'View Paper',
                  icon: Eye,
                  onClick: () => onViewPaper(row),
                },
                {
                  label: 'Assign Evaluator',
                  icon: UserPlus,
                  onClick: () => onAssignEvaluator(row),
                },
                {
                  label: row.status === 'Evaluated' ? 'View Evaluation' : 'Start Evaluation',
                  icon: row.status === 'Evaluated' ? Eye : PlayCircle,
                  onClick: () => onOpenEvaluation(row),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [onViewPaper, onAssignEvaluator, onOpenEvaluation],
  )

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <PaginatedFigmaTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No papers match the selected filters."
        itemLabel="records"
        initialPageSize={10}
        density="comfortable"
        stickyHeader
        stickyLastColumn
        tableMinWidth={1280}
        rowClassName="hover:bg-[#eef6fc]/70"
        resetDeps={resetDeps}
        className="rounded-none shadow-none"
        tableClassName={TABLE_SCROLL_CLASS}
        paginationClassName={cn(
          '[&>div:last-child]:items-center',
          '[&_nav]:items-center',
          '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
          '[&_form_input]:h-9 [&_form_input]:leading-none',
          '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
        )}
      />
    </div>
  )
}
