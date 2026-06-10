import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { StatusBadge } from '../../academics/AcademicsUi'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

function roleStatus(role) {
  return role.enabled ? 'Active' : 'In Active'
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
  renderActions,
}) {
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
      {
        key: 'label',
        label: 'Role Title (Display)',
        render: (row) => (
          <span className="font-semibold text-slate-900">{row.label}</span>
        ),
      },
      {
        key: 'code',
        label: 'Role Code',
        render: (row) => (
          <span className="font-mono text-sm tracking-wide text-[#246392]">
            {row.roleCode || '—'}
          </span>
        ),
      },
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
      {
        key: 'createdAt',
        label: 'Created On',
        render: (row) => (
          <span className="whitespace-nowrap text-slate-500">
            {row.createdAt ? formatCategoryDateTime(row.createdAt) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        headerClassName: 'px-4 text-center sm:px-6',
        cellClassName: 'px-4 text-center align-middle sm:px-6',
        render: (row) => renderActions(row),
      },
    ],
    [roles, paginationStartIndex, statusUpdatingId, renderActions],
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
      tableMinWidth={1000}
    />
  )
}
