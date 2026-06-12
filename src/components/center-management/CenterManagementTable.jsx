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
        headerClassName: 'min-w-[160px]',
        cellClassName: 'min-w-[160px] align-middle',
        render: (row) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">{row.centerName}</div>
            <div className="truncate text-[12px] font-medium text-[#686868]">Code: {row.centerCode}</div>
          </div>
        ),
      },
      {
        key: 'city',
        label: 'City',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] whitespace-nowrap align-middle',
        render: (row) => <span className="font-medium text-[#111]">{row.city || '—'}</span>,
      },
      {
        key: 'state',
        label: 'State',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] whitespace-nowrap align-middle',
        render: (row) => <span className="font-medium text-[#111]">{row.state || '—'}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle',
        render: (row) => <StatusPill status={row.status} />,
      },
      {
        key: 'assignedAdmins',
        label: 'Assigned Admins',
        headerClassName: 'min-w-[130px] whitespace-nowrap',
        cellClassName: 'min-w-[130px] align-middle',
        render: (row) => (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-violet-50 px-2.5 py-1 text-[12px] font-semibold text-violet-800 ring-1 ring-violet-500/15">
            <UserCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            {row.assignedAdmins?.length ?? 0}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">
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
        headerClassName: 'min-w-[200px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[200px] whitespace-nowrap align-middle pr-4 sm:pr-6',
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
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={880}
      paginationClassName={cn(
        '[&>div:last-child]:items-center',
        '[&_nav]:items-center',
        '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
        '[&_form_input]:h-9 [&_form_input]:leading-none',
        '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
      )}
    />
  )
}
