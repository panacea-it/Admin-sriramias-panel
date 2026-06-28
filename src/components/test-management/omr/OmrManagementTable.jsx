import { useMemo } from 'react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'
import { createActionsColumn } from '../../../utils/tableColumnHelpers'
import OmrStatusBadge from './OmrStatusBadge'
import { OmrYesNoBadge } from './OmrSortableHeader'

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
  controlledPagination,
  onRowClick,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'examName',
        label: 'Exam Name',
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
        render: (row) => <OmrStatusBadge status={row.status} />,
      },
      {
        key: 'resultSheetUploaded',
        label: 'Result Sheet',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle',
        render: (row) => <OmrYesNoBadge value={row.resultSheetUploaded} />,
      },
      {
        key: 'uploadDate',
        label: 'Upload Date',
        headerClassName: 'min-w-[150px] whitespace-nowrap',
        cellClassName: 'min-w-[150px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">
            {row.uploadDate || row.resultSheet?.uploadedAt
              ? formatCategoryDateTime(row.uploadDate || row.resultSheet?.uploadedAt)
              : '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        headerClassName: 'min-w-[150px] whitespace-nowrap',
        cellClassName: 'min-w-[150px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">
            {row.createdDate || row.createdAt
              ? formatCategoryDateTime(row.createdDate || row.createdAt)
              : '—'}
          </span>
        ),
      },
      createActionsColumn({
        buttonCount: 3,
        align: 'right',
        render: (row) => renderActions(row),
      }),
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
      rowClassName="hover:bg-[#eef6fc]/70 cursor-pointer"
      onRowClick={onRowClick}
      controlledPagination={controlledPagination}
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
