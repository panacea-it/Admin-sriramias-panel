import { useMemo } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import ExamCategoryTableActions from '../../../../components/categories/ExamCategoryTableActions'
import CategoryStandardTable from '../../../../components/categories/CategoryStandardTable'
import {
  categoryActionsColumn,
  categoryDateColumn,
  categoryIdColumn,
  categoryNameColumn,
  categoryStatusColumn,
  categoryTruncatedTextColumn,
} from '../../../../components/categories/categoryTableColumns'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'
import { cn } from '../../../../utils/cn'

function SortableLabel({ label, columnKey, sortBy, sortOrder, onSort, sortKey }) {
  const active = sortBy === sortKey
  const Icon = active ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <button
      type="button"
      onClick={() => onSort?.(columnKey)}
      className={cn(
        'inline-flex items-center gap-1 font-semibold transition hover:text-white/90',
        active && 'text-white',
      )}
    >
      {label}
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
    </button>
  )
}

function withSortableLabel(column, { sortBy, sortOrder, onSort, sortKey }) {
  return {
    ...column,
    label: (
      <SortableLabel
        label={column.label}
        columnKey={column.key}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        sortKey={sortKey}
      />
    ),
    headerTruncate: false,
  }
}

export default function TopicTable({
  topics,
  loading,
  controlledPagination,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  resetDeps = [],
  selection,
}) {
  const columns = useMemo(() => {
    const base = [
      withSortableLabel(
        categoryIdColumn({
          key: 'displayId',
          label: 'ID',
          getValue: (row) => row.displayId || row.topicId || row.id,
        }),
        { sortBy, sortOrder, onSort, sortKey: 'topicId' },
      ),
      withSortableLabel(categoryNameColumn({ label: 'Topic', key: 'name' }), {
        sortBy,
        sortOrder,
        onSort,
        sortKey: 'topicName',
      }),
      categoryTruncatedTextColumn({ key: 'subject', label: 'Subject' }),
      categoryDateColumn({
        key: 'createdAt',
        label: 'Created On',
        formatFn: formatCategoryDateTime,
      }),
      categoryDateColumn({
        key: 'modifiedAt',
        label: 'Modified On',
        formatFn: formatCategoryDateTime,
      }),
      withSortableLabel(
        categoryStatusColumn((row) => <CategoryStatusBadge status={row.status} />),
        { sortBy, sortOrder, onSort, sortKey: 'status' },
      ),
      categoryActionsColumn((row) => (
        <ExamCategoryTableActions
          row={row}
          onView={() => onView(row)}
          onEdit={() => onEdit(row)}
          onDelete={() => onDelete(row)}
          onStatusToggle={() => onToggleStatus(row)}
        />
      )),
    ]

    return base
  }, [onView, onEdit, onDelete, onToggleStatus, sortBy, sortOrder, onSort])

  return (
    <CategoryStandardTable
      columns={columns}
      data={topics}
      loading={loading}
      skeletonRowCount={8}
      itemLabel="topics"
      resetDeps={resetDeps}
      selection={selection}
      controlledPagination={controlledPagination}
      tableMinWidth={1020}
    />
  )
}
