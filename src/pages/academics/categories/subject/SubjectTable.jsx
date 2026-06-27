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

export default function SubjectTable({
  subjects,
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
          getValue: (row) => row.displayId || row.subjectId || row.id,
        }),
        { sortBy, sortOrder, onSort, sortKey: 'subjectId' },
      ),
      withSortableLabel(categoryNameColumn({ label: 'Subject', key: 'name' }), {
        sortBy,
        sortOrder,
        onSort,
        sortKey: 'subjectName',
      }),
      withSortableLabel(
        categoryDateColumn({
          key: 'createdAt',
          label: 'Created On',
          formatFn: formatCategoryDateTime,
        }),
        { sortBy, sortOrder, onSort, sortKey: 'createdAt' },
      ),
      categoryDateColumn({
        key: 'modifiedAt',
        label: 'Modified On',
        formatFn: formatCategoryDateTime,
      }),
      withSortableLabel(categoryStatusColumn((row) => <CategoryStatusBadge status={row.status} />), {
        sortBy,
        sortOrder,
        onSort,
        sortKey: 'status',
      }),
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
  }, [sortBy, sortOrder, onSort, onView, onEdit, onDelete, onToggleStatus])

  return (
    <CategoryStandardTable
      columns={columns}
      data={subjects}
      loading={loading}
      skeletonRowCount={8}
      itemLabel="subjects"
      resetDeps={resetDeps}
      selection={selection}
      controlledPagination={controlledPagination}
    />
  )
}
