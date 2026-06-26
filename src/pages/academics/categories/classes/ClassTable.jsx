import { useMemo } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import CategoryStandardTable from '../../../../components/categories/CategoryStandardTable'
import {
  categoryDateColumn,
  categoryNameColumn,
  categoryTruncatedTextColumn,
} from '../../../../components/categories/categoryTableColumns'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'
import { cn } from '../../../../utils/cn'
import ClassTableActions from './ClassTableActions'

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

function statusColumn(render) {
  return {
    key: 'status',
    label: 'Status',
    align: 'center',
    headerClassName: 'min-w-[6.5rem] whitespace-nowrap text-center',
    cellClassName: 'min-w-[6.5rem] whitespace-nowrap align-middle text-center',
    render,
  }
}

export default function ClassTable({
  classes,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onToggleStatus,
  resetDeps = [],
  selection,
}) {
  const columns = useMemo(() => {
    return [
      withSortableLabel(categoryTruncatedTextColumn({ key: 'subject', label: 'Subject', accent: true }), {
        sortBy,
        sortOrder,
        onSort,
        sortKey: 'subject',
      }),
      withSortableLabel(categoryNameColumn({ label: 'Class Name', key: 'name' }), {
        sortBy,
        sortOrder,
        onSort,
        sortKey: 'name',
      }),
      withSortableLabel(
        statusColumn((row) => (
          <div className="flex justify-center">
            <CategoryStatusBadge status={row.status} />
          </div>
        )),
        { sortBy, sortOrder, onSort, sortKey: 'status' },
      ),
      withSortableLabel(
        categoryDateColumn({
          key: 'createdAt',
          label: 'Created On',
          formatFn: formatCategoryDateTime,
        }),
        { sortBy, sortOrder, onSort, sortKey: 'createdAt' },
      ),
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        width: 240,
        headerTruncate: false,
        headerClassName: 'min-w-[240px] whitespace-nowrap px-4 text-center align-middle sm:px-6',
        cellClassName: 'min-w-[240px] whitespace-nowrap align-middle px-4 text-center sm:px-6',
        render: (row) => (
          <ClassTableActions
            row={row}
            onView={() => onView(row)}
            onEdit={() => onEdit(row)}
            onToggleStatus={() => onToggleStatus(row)}
          />
        ),
      },
    ]
  }, [onView, onEdit, onToggleStatus, sortBy, sortOrder, onSort])

  return (
    <CategoryStandardTable
      columns={columns}
      data={classes}
      loading={loading}
      skeletonRowCount={8}
      itemLabel="classes"
      resetDeps={resetDeps}
      selection={selection}
      tableMinWidth={960}
    />
  )
}
