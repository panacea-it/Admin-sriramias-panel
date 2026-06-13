import { useMemo } from 'react'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import CourseTableActions from '../../../../components/categories/CourseTableActions'
import PaginatedFigmaTable from '../../../../components/figma/PaginatedFigmaTable'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'
import { cn } from '../../../../utils/cn'

export default function TeacherTable({
  teachers,
  loading,
  controlledPagination,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  resetDeps = [],
  selection,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'ID',
        headerClassName: 'min-w-[5rem]',
        cellClassName: 'whitespace-nowrap font-medium tabular-nums',
        render: (row) => row.displayId || row.teacherId || row.id,
      },
      {
        key: 'name',
        label: 'Name',
        render: (row) => <span className="font-semibold text-[#111]">{row.name}</span>,
      },
      {
        key: 'subject',
        label: 'Subject',
        cellClassName: 'max-w-[180px]',
        render: (row) => (
          <span className="text-sm font-medium text-[#444]">{row.subject || '—'}</span>
        ),
      },
      {
        key: 'centerName',
        label: 'Center',
        cellClassName: 'max-w-[180px]',
        render: (row) => (
          <span className="text-sm font-medium text-[#444]">{row.centerName || '—'}</span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Added On',
        render: (row) => (
          <span className="whitespace-nowrap text-sm text-[#444]">
            {formatCategoryDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        key: 'modifiedAt',
        label: 'Modified On',
        render: (row) => (
          <span className="whitespace-nowrap text-sm text-[#444]">
            {formatCategoryDateTime(row.modifiedAt)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        headerClassName: 'min-w-[6rem]',
        render: (row) => <CategoryStatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[200px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[200px] whitespace-nowrap align-middle pr-4 sm:pr-6',
        render: (row) => (
          <CourseTableActions
            row={row}
            status={row.status}
            onView={() => onView(row)}
            onEdit={() => onEdit(row)}
            onDelete={() => onDelete(row)}
            onToggleStatus={() => onToggleStatus(row)}
          />
        ),
      },
    ],
    [onView, onEdit, onDelete, onToggleStatus],
  )

  return (
    <div className="overflow-hidden rounded-2xl bg-[#f0f2f5]/60 p-2 sm:p-3">
      <PaginatedFigmaTable
        columns={columns}
        data={teachers}
        loading={loading}
        skeletonRowCount={8}
        itemLabel="teachers"
        resetDeps={resetDeps}
        selection={selection}
        density="comfortable"
        controlledPagination={controlledPagination}
        rowClassName={cn(
          'bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-shadow duration-200',
          'hover:bg-white hover:shadow-[0_4px_16px_rgba(15,23,42,0.1)]',
        )}
        tableClassName={cn(
          'rounded-xl bg-transparent shadow-none',
          '[&_table]:border-separate [&_table]:border-spacing-y-2',
          '[&_thead_tr]:bg-gradient-to-r [&_thead_tr]:from-[#7eb8e8] [&_thead_tr]:to-[#55ace7]',
          '[&_thead_tr]:shadow-[0_2px_8px_rgba(85,172,231,0.25)]',
          '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap',
          '[&_tbody_tr]:rounded-xl [&_tbody_tr]:overflow-hidden',
          '[&_tbody_td]:align-middle',
          '[&_tbody_td:first-child]:rounded-l-xl [&_tbody_td:last-child]:rounded-r-xl',
        )}
        className="rounded-xl bg-transparent shadow-none"
      />
    </div>
  )
}
