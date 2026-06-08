import { useMemo } from 'react'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import CategoryTableActions from '../../../../components/categories/CategoryTableActions'
import PaginatedFigmaTable from '../../../../components/figma/PaginatedFigmaTable'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'

export default function TopicTable({
  topics,
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
        render: (row) => row.displayId || row.topicId || row.id,
      },
      {
        key: 'name',
        label: 'Topic',
        render: (row) => <span className="font-semibold">{row.name}</span>,
      },
      {
        key: 'subject',
        label: 'Subject',
        render: (row) => <span className="text-sm text-[#444]">{row.subject || '—'}</span>,
      },
      {
        key: 'createdAt',
        label: 'Created On',
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
        headerClassName: 'min-w-[11rem] text-right',
        cellClassName: 'min-w-[11rem] text-right',
        render: (row) => (
          <CategoryTableActions
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
      data={topics}
      loading={loading}
      skeletonRowCount={8}
      itemLabel="topics"
      resetDeps={resetDeps}
      rowClassName="transition-colors hover:bg-[#f8fbff]"
      controlledPagination={controlledPagination}
    />
  )
}
