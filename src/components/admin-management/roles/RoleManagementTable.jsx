import { useMemo } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { StatusBadge } from '../../academics/AcademicsUi'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { createActionsColumn } from '../../../utils/tableColumnHelpers'
import { cn } from '../../../utils/cn'

function roleStatus(role) {
  return role.status === 'INACTIVE' ? 'In Active' : 'Active'
}

function SortableLabel({ label, columnKey, sortBy, sortOrder, onSort }) {
  const active = sortBy === columnKey
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
  const columnKey = sortKey || column.key
  return {
    ...column,
    label: (
      <SortableLabel
        label={column.label}
        columnKey={columnKey}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    headerTruncate: false,
  }
}

export default function RoleManagementTable({
  roles,
  loading,
  controlledPagination,
  selection,
  resetDeps = [],
  emptyMessage,
  emptyState,
  paginationStartIndex,
  statusUpdatingId,
  sortBy,
  sortOrder,
  onSort,
  renderActions,
}) {
  const sortProps = { sortBy, sortOrder, onSort }

  const columns = useMemo(
    () => [
      {
        key: 'num',
        label: '#',
        headerClassName: 'w-14 pl-6 sm:pl-8',
        cellClassName: 'pl-6 sm:pl-8 text-slate-500 tabular-nums',
        render: (row) => {
          const index = roles.findIndex((r) => r.id === row.id)
          return index >= 0 ? paginationStartIndex + index + 1 : '—'
        },
      },
      withSortableLabel(
        {
          key: 'label',
          label: 'Role Title (Display)',
          render: (row) => (
            <span className="font-semibold text-slate-900">{row.label}</span>
          ),
        },
        { ...sortProps, sortKey: 'roleTitle' },
      ),
      withSortableLabel(
        {
          key: 'code',
          label: 'Role Code',
          render: (row) => (
            <span className="font-mono text-sm tracking-wide text-[#246392]">
              {row.roleCode || '—'}
            </span>
          ),
        },
        { ...sortProps, sortKey: 'roleCode' },
      ),
      withSortableLabel(
        {
          key: 'status',
          label: 'Status',
          render: (row) => {
            if (statusUpdatingId === row.id) {
              return (
                <span className="inline-flex min-w-[88px] items-center justify-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Updating
                </span>
              )
            }
            return <StatusBadge status={roleStatus(row)} />
          },
        },
        { ...sortProps, sortKey: 'status' },
      ),
      withSortableLabel(
        {
          key: 'createdAt',
          label: 'Created On',
          render: (row) => (
            <span className="whitespace-nowrap text-slate-500">
              {row.createdAt ? formatCategoryDateTime(row.createdAt) : '—'}
            </span>
          ),
        },
        { ...sortProps, sortKey: 'createdAt' },
      ),
      createActionsColumn({
        buttonCount: 4,
        align: 'right',
        render: (row) => renderActions(row),
      }),
    ],
    [roles, paginationStartIndex, statusUpdatingId, renderActions, sortBy, sortOrder, onSort],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={roles}
      emptyMessage={emptyMessage}
      emptyState={emptyState}
      itemLabel="roles"
      loading={loading}
      skeletonRowCount={8}
      controlledPagination={controlledPagination}
      resetDeps={resetDeps}
      selection={selection}
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={1100}
    />
  )
}
