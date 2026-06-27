import { useMemo } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import CategoryStatusBadge from '../categories/CategoryStatusBadge'
import ExamCategoryTableActions from '../categories/ExamCategoryTableActions'
import CategoryStandardTable from '../categories/CategoryStandardTable'
import {
  categoryActionsColumn,
  categoryDateColumn,
  categoryStatusColumn,
  categoryTruncatedTextColumn,
} from '../categories/categoryTableColumns'
import { formatCityDateTime } from '../../utils/cityApiHelpers'
import { cn } from '../../utils/cn'

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

export function buildCityTableColumns({
  onView,
  onEdit,
  onToggle,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}) {
  return [
    withSortableLabel(
      categoryTruncatedTextColumn({
        key: 'centerName',
        label: 'Center Name',
        accent: true,
      }),
      { sortBy, sortOrder, onSort, sortKey: 'centerName' },
    ),
    withSortableLabel(
      {
        key: 'cityAddress',
        label: 'City Address',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'max-w-[280px]',
        render: (row) => {
          const value = row.cityAddress || row.placeName || '—'
          return (
            <span className="block truncate font-semibold text-[#111]" title={value}>
              {value}
            </span>
          )
        },
      },
      { sortBy, sortOrder, onSort, sortKey: 'cityAddress' },
    ),
    withSortableLabel(categoryStatusColumn((row) => (
      <CategoryStatusBadge status={row.status === 'In Active' ? 'In Active' : row.status} />
    )), { sortBy, sortOrder, onSort, sortKey: 'status' }),
    withSortableLabel(
      categoryDateColumn({
        key: 'createdAt',
        label: 'Created',
        formatFn: formatCityDateTime,
      }),
      { sortBy, sortOrder, onSort, sortKey: 'createdAt' },
    ),
    categoryDateColumn({
      key: 'updatedAt',
      label: 'Updated',
      formatFn: formatCityDateTime,
    }),
    categoryActionsColumn((row) => (
      <ExamCategoryTableActions
        row={{ ...row, name: row.cityAddress || row.placeName }}
        onView={() => onView(row)}
        onEdit={() => onEdit(row)}
        onStatusToggle={() => onToggle(row)}
        onDelete={() => onDelete(row)}
      />
    )),
  ]
}

export default function CityTable({
  cities,
  loading,
  controlledPagination,
  columns,
  resetDeps = [],
}) {
  return (
    <CategoryStandardTable
      columns={columns}
      data={cities}
      loading={loading}
      skeletonRowCount={8}
      itemLabel="cities"
      resetDeps={resetDeps}
      controlledPagination={controlledPagination}
      tableMinWidth={1020}
    />
  )
}
