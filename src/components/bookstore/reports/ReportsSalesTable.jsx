import { useMemo } from 'react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { cn } from '../../../utils/cn'
import { formatINR } from '../../../utils/financeFilters'

export default function ReportsSalesTable({
  rows,
  loading = false,
  resetDeps = [],
}) {
  const columns = useMemo(
    () => [
      {
        key: 'productId',
        label: 'SKU',
        headerClassName: 'min-w-[110px] whitespace-nowrap pl-4 sm:pl-6',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle pl-4 sm:pl-6',
        render: (row) => (
          <span className="font-semibold text-[#246392]">{row.productId}</span>
        ),
      },
      {
        key: 'name',
        label: 'Product',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'min-w-[200px] align-middle',
        render: (row) => (
          <span className="block max-w-[260px] truncate font-semibold text-slate-900" title={row.name}>
            {row.name}
          </span>
        ),
      },
      {
        key: 'units',
        label: 'Units',
        align: 'center',
        headerClassName: 'min-w-[90px] whitespace-nowrap',
        cellClassName: 'min-w-[90px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-semibold tabular-nums text-[#111]">{row.units}</span>
        ),
      },
      {
        key: 'revenue',
        label: 'Revenue',
        align: 'center',
        headerClassName: 'min-w-[120px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[120px] whitespace-nowrap align-middle text-center pr-4 sm:pr-6',
        render: (row) => (
          <span className="font-semibold tabular-nums text-[#111]">{formatINR(row.revenue)}</span>
        ),
      },
    ],
    [],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={rows}
      itemLabel="rows"
      loading={loading}
      skeletonRowCount={8}
      resetDeps={resetDeps}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={720}
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
