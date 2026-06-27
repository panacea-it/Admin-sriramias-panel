import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import CategoryStatusBadge from '../categories/CategoryStatusBadge'
import ExamCategoryTableActions from '../categories/ExamCategoryTableActions'
import {
  categoryActionsColumn,
  categoryDateColumn,
  categoryStatusColumn,
  categoryTruncatedTextColumn,
} from '../categories/categoryTableColumns'
import { CATEGORY_COL } from '../../utils/categoryUiStandards'
import { formatClassroomDateTime } from '../../utils/classroomApiHelpers'
import { normalizeClassroomStatus } from '../../utils/classroomsStorage'
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

function UsageCell({ row }) {
  const upcoming = row.usage?.upcoming ?? 0
  const totalBookings = row.usage?.totalBookings ?? 0

  return (
    <div className="flex min-w-[96px] flex-col items-start gap-0.5 text-xs">
      <span className="font-semibold text-[#246392]">{upcoming} upcoming</span>
      <span className="text-[#94a3b8]">{totalBookings} total bookings</span>
    </div>
  )
}

export function buildClassroomTableColumns({
  onView,
  onEdit,
  onToggle,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}) {
  const sortProps = { sortBy, sortOrder, onSort }

  return [
    {
      key: 'classroomId',
      label: 'Classroom ID',
      headerClassName: CATEGORY_COL.idHeader,
      cellClassName: CATEGORY_COL.idCell,
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-[#111]">
          {row.classroomId || '—'}
        </span>
      ),
    },
    withSortableLabel(
      {
        key: 'name',
        label: 'Name',
        headerClassName: CATEGORY_COL.nameHeader,
        cellClassName: CATEGORY_COL.nameCell,
        render: (row) => (
          <span className="truncate font-semibold text-[#111]" title={row.name}>
            {row.name || '—'}
          </span>
        ),
      },
      { ...sortProps, sortKey: 'classroomName' },
    ),
    withSortableLabel(
      {
        key: 'code',
        label: 'Code',
        headerClassName: CATEGORY_COL.idHeader,
        cellClassName: CATEGORY_COL.idCell,
        render: (row) => (
          <span className="font-mono text-sm font-semibold text-[#111]">{row.code || '—'}</span>
        ),
      },
      { ...sortProps, sortKey: 'classroomCode' },
    ),
    withSortableLabel(
      categoryTruncatedTextColumn({
        key: 'centerName',
        label: 'Center',
        accent: true,
      }),
      { ...sortProps, sortKey: 'centerName' },
    ),
    withSortableLabel(
      categoryTruncatedTextColumn({
        key: 'placeName',
        label: 'City / Branch',
      }),
      { ...sortProps, sortKey: 'cityAddress' },
    ),
    withSortableLabel(
      {
        key: 'capacity',
        label: 'Capacity',
        headerClassName: CATEGORY_COL.statusHeader,
        cellClassName: 'whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="text-sm font-medium text-[#686868]">
            {row.capacity != null ? row.capacity : '—'}
          </span>
        ),
      },
      { ...sortProps, sortKey: 'capacity' },
    ),
    withSortableLabel(
      categoryStatusColumn((row) => (
        <CategoryStatusBadge status={normalizeClassroomStatus(row.status)} />
      )),
      { ...sortProps, sortKey: 'status' },
    ),
    {
      key: 'usage',
      label: 'Bookings',
      headerClassName: CATEGORY_COL.textHeader,
      cellClassName: CATEGORY_COL.textCell,
      render: (row) => <UsageCell row={row} />,
    },
    withSortableLabel(
      categoryDateColumn({
        key: 'createdAt',
        label: 'Created',
        formatFn: formatClassroomDateTime,
      }),
      { ...sortProps, sortKey: 'createdAt' },
    ),
    categoryActionsColumn((row) => (
      <ExamCategoryTableActions
        row={row}
        onView={() => onView(row)}
        onEdit={() => onEdit(row)}
        onStatusToggle={() => onToggle(row)}
        onDelete={() => onDelete(row)}
      />
    )),
  ]
}
