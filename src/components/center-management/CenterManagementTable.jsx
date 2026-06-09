import { useMemo } from 'react'
import { UserCheck } from 'lucide-react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { cn } from '../../utils/cn'

function StatusPill({ status }) {
  const active = status === 'active'
  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        active
          ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
          : 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
      )}
    >
      {active ? 'Active' : 'Disabled'}
    </span>
  )
}

export default function CenterManagementTable({
  centers,
  loading,
  controlledPagination,
  selection,
  resetDeps = [],
  emptyMessage,
  emptyState,
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'centerName',
        label: 'Center',
        headerClassName: 'pl-6 sm:pl-8',
        cellClassName: 'pl-6 sm:pl-8',
        render: (row) => (
          <div>
            <div className="font-semibold text-slate-900">{row.centerName}</div>
            <div className="text-[12px] font-medium text-[#686868]">Code: {row.centerCode}</div>
          </div>
        ),
      },
      {
        key: 'city',
        label: 'City',
        render: (row) => <span className="font-medium text-[#111]">{row.city || '—'}</span>,
      },
      {
        key: 'state',
        label: 'State',
        render: (row) => <span className="font-medium text-[#111]">{row.state || '—'}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusPill status={row.status} />,
      },
      {
        key: 'assignedAdmins',
        label: 'Assigned Admins',
        render: (row) => (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-[12px] font-semibold text-violet-800 ring-1 ring-violet-500/15">
            <UserCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
            {row.assignedAdmins?.length ?? 0}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (row) => (
          <span className="whitespace-nowrap font-medium text-[#686868]">
            {row.createdAt
              ? new Date(row.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'pr-6 sm:pr-8',
        cellClassName: 'pr-6 sm:pr-8',
        render: (row) => renderActions(row),
      },
    ],
    [renderActions],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={centers}
      emptyMessage={emptyMessage}
      emptyState={emptyState}
      itemLabel="centers"
      loading={loading}
      skeletonRowCount={8}
      controlledPagination={controlledPagination}
      resetDeps={resetDeps}
      selection={selection}
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={920}
    />
  )
}
