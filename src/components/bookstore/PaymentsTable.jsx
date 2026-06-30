import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import BookstoreStatusBadge from './BookstoreStatusBadge'
import { cn } from '../../utils/cn'
import { formatINR } from '../../utils/financeFilters'

export default function PaymentsTable({
  payments,
  loading = false,
  resetDeps = [],
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'Transaction ID',
        headerClassName: 'min-w-[130px] whitespace-nowrap pl-4 sm:pl-6',
        cellClassName: 'min-w-[130px] whitespace-nowrap align-middle pl-4 sm:pl-6',
        render: (row) => (
          <span className="font-semibold text-[#246392]">{row.id}</span>
        ),
      },
      {
        key: 'orderId',
        label: 'Order ID',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#111]">{row.orderId}</span>
        ),
      },
      {
        key: 'customerName',
        label: 'Customer Name',
        headerClassName: 'min-w-[160px]',
        cellClassName: 'min-w-[160px] align-middle',
        render: (row) => (
          <span className="block truncate font-semibold text-slate-900" title={row.customerName}>
            {row.customerName}
          </span>
        ),
      },
      {
        key: 'bookName',
        label: 'Book Name',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'min-w-[200px] align-middle',
        render: (row) => (
          <span
            className="block max-w-[240px] truncate text-[13px] font-medium text-[#111]"
            title={row.bookName}
          >
            {row.bookName || '—'}
          </span>
        ),
      },
      {
        key: 'gateway',
        label: 'Payment Gateway',
        align: 'center',
        headerClassName: 'min-w-[130px] whitespace-nowrap',
        cellClassName: 'min-w-[130px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="inline-flex items-center rounded-lg bg-violet-50 px-2.5 py-1 text-[12px] font-semibold text-violet-800 ring-1 ring-violet-500/15">
            {row.gateway}
          </span>
        ),
      },
      {
        key: 'amount',
        label: 'Amount',
        align: 'center',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-semibold tabular-nums text-[#111]">{formatINR(row.amount)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Payment Status',
        align: 'center',
        headerClassName: 'min-w-[130px] whitespace-nowrap',
        cellClassName: 'min-w-[130px] align-middle text-center',
        render: (row) => <BookstoreStatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        headerClassName: 'min-w-[180px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[180px] whitespace-nowrap align-middle pr-4 sm:pr-6 text-center',
        render: (row) => renderActions(row),
      },
    ],
    [renderActions],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={payments}
      itemLabel="transactions"
      loading={loading}
      skeletonRowCount={8}
      resetDeps={resetDeps}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={1040}
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
