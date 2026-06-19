import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { cn } from '../../utils/cn'
import { formatINR } from '../../utils/financeFilters'
import { getProductExamCategory } from '../../utils/bookstoreProductForm'

function ProductStatusPill({ status }) {
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
      {active ? 'Active' : 'Deactivated'}
    </span>
  )
}

export default function ProductsTable({
  products,
  loading,
  resetDeps = [],
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'Product ID',
        headerClassName: 'min-w-[110px] whitespace-nowrap pl-4 sm:pl-6',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle pl-4 sm:pl-6',
        render: (row) => (
          <span className="font-semibold text-[#246392]">{row.id}</span>
        ),
      },
      {
        key: 'name',
        label: 'Product Name',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'min-w-[200px] align-middle',
        render: (row) => (
          <div className="min-w-0">
            <div
              className="truncate font-semibold text-slate-900"
              title={row.name}
            >
              {row.name}
            </div>
            {row.authorName && (
              <div className="truncate text-[12px] font-medium text-[#686868]">
                by {row.authorName}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'category',
        label: 'Exam Category',
        headerClassName: 'min-w-[140px] whitespace-nowrap',
        cellClassName: 'min-w-[140px] whitespace-nowrap align-middle',
        render: (row) => {
          const category = getProductExamCategory(row)
          return (
          <span
            className="inline-flex max-w-[180px] items-center rounded-lg bg-violet-50 px-2.5 py-1 text-[12px] font-semibold text-violet-800 ring-1 ring-violet-500/15"
            title={category}
          >
            <span className="truncate">{category || '—'}</span>
          </span>
          )
        },
      },
      {
        key: 'discountPrice',
        label: 'Price',
        align: 'center',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-semibold text-[#111]">
            {formatINR(row.discountPrice)}
          </span>
        ),
      },
      {
        key: 'stockQuantity',
        label: 'Stock',
        align: 'center',
        headerClassName: 'min-w-[80px] whitespace-nowrap',
        cellClassName: 'min-w-[80px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span
            className={cn(
              'font-semibold tabular-nums',
              row.stockQuantity === 0
                ? 'text-red-600'
                : row.stockQuantity < 25
                  ? 'text-amber-700'
                  : 'text-[#111]',
            )}
          >
            {row.stockQuantity?.toLocaleString() ?? '—'}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle',
        render: (row) => <ProductStatusPill status={row.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[260px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[260px] whitespace-nowrap align-middle pr-4 sm:pr-6',
        render: (row) => renderActions(row),
      },
    ],
    [renderActions],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={products}
      itemLabel="products"
      loading={loading}
      skeletonRowCount={8}
      resetDeps={resetDeps}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={960}
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
