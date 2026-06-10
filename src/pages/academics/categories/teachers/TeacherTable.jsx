import { useMemo } from 'react'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import CategoryTableActions from '../../../../components/categories/CategoryTableActions'
import PaginatedFigmaTable from '../../../../components/figma/PaginatedFigmaTable'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'

export default function TeacherTable({
  teachers,
  loading,
  controlledPagination,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  resetDeps = [],
}) {
  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'ID',
        headerClassName: 'pl-6 sm:pl-8',
        cellClassName: 'pl-6 sm:pl-8 font-medium tabular-nums',
        render: (row) => row.displayId || row.teacherId || row.id,
      },
      {
        key: 'name',
        label: 'Name',
        render: (row) => <span className="font-semibold">{row.name}</span>,
      },
      {
        key: 'subject',
        label: 'Subject',
        render: (row) => <span className="text-sm text-[#444]">{row.subject || '—'}</span>,
      },
      {
        key: 'centerName',
        label: 'Center',
        render: (row) => (
          <span className="text-sm font-medium text-[#1a3a5c]">{row.centerName || '—'}</span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Added On',
        render: (row) => (
          <span className="whitespace-nowrap text-sm">{formatCategoryDateTime(row.createdAt)}</span>
        ),
      },
      {
        key: 'modifiedAt',
        label: 'Modified On',
        render: (row) => (
          <span className="whitespace-nowrap text-sm">{formatCategoryDateTime(row.modifiedAt)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <CategoryStatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[11rem] pr-5 sm:pr-6',
        cellClassName: 'min-w-[11rem] pr-5 sm:pr-6',
        render: (row) => (
          <CategoryTableActions
            variant="icons"
            statusLabel="Status"
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
    <PaginatedFigmaTable
      columns={columns}
      data={teachers}
      loading={loading}
      skeletonRowCount={8}
      itemLabel="teachers"
      resetDeps={resetDeps}
      rowClassName="transition-colors hover:bg-[#f8fbff]"
      controlledPagination={controlledPagination}
    />
  )
}
