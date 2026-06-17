import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import BookstoreStatusBadge from './BookstoreStatusBadge'
import { cn } from '../../utils/cn'
import { formatINR } from '../../utils/financeFilters'

export default function OrdersTable({
  orders,
  loading = false,
  resetDeps = [],
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'Order ID',
        headerClassName: 'min-w-[120px] whitespace-nowrap pl-4 sm:pl-6',
        cellClassName: 'min-w-[120px] whitespace-nowrap align-middle pl-4 sm:pl-6',
        render: (row) => (
          <span className="font-semibold text-[#246392]">{row.id}</span>
        ),
      },
      {
        key: 'customerName',
        label: 'Customer',
        headerClassName: 'min-w-[180px]',
        cellClassName: 'min-w-[180px] align-middle',
        render: (row) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900" title={row.customerName}>
              {row.customerName}
            </div>
            {row.email && (
              <div className="truncate text-[12px] font-medium text-[#686868]">
                {row.email}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'total',
        label: 'Total',
        align: 'center',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-semibold tabular-nums text-[#111]">{formatINR(row.total)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle text-center',
        render: (row) => <BookstoreStatusBadge status={row.status} />,
      },
      {
        key: 'paymentStatus',
        label: 'Payment',
        align: 'center',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle text-center',
        render: (row) => <BookstoreStatusBadge status={row.paymentStatus} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        headerClassName: 'min-w-[150px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[150px] whitespace-nowrap align-middle pr-4 sm:pr-6 text-center',
        render: (row) => renderActions(row),
      },
    ],
    [renderActions],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={orders}
      itemLabel="orders"
      loading={loading}
      skeletonRowCount={8}
      resetDeps={resetDeps}
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
