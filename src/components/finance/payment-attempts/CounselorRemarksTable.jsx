import { useMemo } from 'react'
import { Eye } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import {
  REMARK_PREVIEW_MAX_LENGTH,
  SUBJECT_PREVIEW_MAX_LENGTH,
  truncateRemarkPreview,
} from '../../../utils/paymentAttemptRemarks'
import { formatLastAttemptDisplay } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function CounselorRemarksTable({
  remarks,
  onViewRemark,
  onRequestDeleteRemark,
  resetDeps = [],
}) {
  const renderActions = (row) => (
    <div className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5">
      </div>
  )

  const columns = useMemo(
    () => [
      {
        key: 'attemptId',
        label: 'Attempt ID',
        headerClassName: 'min-w-[110px]',
        cellClassName: 'min-w-[110px] align-middle',
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-[#246392]">{row.attemptId}</span>
        ),
      },
      {
        key: 'center',
        label: 'Center',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] align-middle whitespace-nowrap',
        render: (row) => (
          <span className="font-medium text-[#111]">{row.center || '—'}</span>
        ),
      },
      {
        key: 'student',
        label: 'Student',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'min-w-[140px] align-middle',
        render: (row) => <span className="font-semibold text-slate-900">{row.student}</span>,
      },
      {
        key: 'counselor',
        label: 'Assigned Counselor',
        headerClassName: 'min-w-[150px]',
        cellClassName: 'min-w-[150px] align-middle',
        render: (row) => (
          <span className="font-medium text-[#111]">{row.counselor || '—'}</span>
        ),
      },
      {
        key: 'subject',
        label: 'Remark Subject',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'min-w-[140px] align-middle',
        render: (row) => (
          <span className="block max-w-[200px] text-[13px] text-[#111]">
            {truncateRemarkPreview(row.subject, SUBJECT_PREVIEW_MAX_LENGTH)}
          </span>
        ),
      },
      {
        key: 'remarkPreview',
        label: 'Remark Preview',
        headerClassName: 'min-w-[160px]',
        cellClassName: 'min-w-[160px] align-middle',
        render: (row) => (
          <span className="block max-w-[260px] text-[13px] text-[#686868]">
            {truncateRemarkPreview(row.remark, REMARK_PREVIEW_MAX_LENGTH)}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle whitespace-nowrap',
        render: (row) => {
          const { time, date } = formatLastAttemptDisplay(row.createdAt)
          return (
            <div className="text-[13px]">
              <p className="font-medium text-[#111]">{date}</p>
              <p className="text-[#686868]">{time}</p>
            </div>
          )
        },
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[160px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[160px] whitespace-nowrap align-middle pr-4 sm:pr-6',
        render: (row) => renderActions(row),
      },
    ],
    [onRequestDeleteRemark],
  )

  const emptyState = (
    <div className="px-4 py-10 text-center sm:px-6">
      <p className="text-base font-semibold text-slate-700">No counselor remarks yet</p>
      <p className="mt-1 text-sm text-slate-500">Remarks saved from assigned payment attempts will appear here.</p>
    </div>
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={remarks}
      emptyMessage="No counselor remarks yet"
      emptyState={emptyState}
      itemLabel="remarks"
      skeletonRowCount={5}
      resetDeps={resetDeps}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={1060}
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
