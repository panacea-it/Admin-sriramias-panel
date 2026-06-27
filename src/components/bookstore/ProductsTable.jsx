import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import ProductStatusPill from './ProductStatusPill'
import { createActionsColumn } from '../../utils/tableColumnHelpers'
import { cn } from '../../utils/cn'
import { formatINR } from '../../utils/financeFilters'

function ProductThumbnail({ url, name }) {
  if (!url) {
    return (
      <div className="flex h-12 w-10 items-center justify-center rounded-md bg-slate-100 text-[10px] font-semibold text-slate-400">
        N/A
      </div>
    )
  }

  return (
    <div className="h-12 w-10 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
      <img src={url} alt={name || 'Product'} className="h-full w-full object-cover" />
    </div>
  )
}

export default function ProductsTable({
  products,
  loading,
  resetDeps = [],
  renderActions,
  controlledPagination,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'thumbnail',
        label: 'Product Image',
        headerClassName: 'min-w-[90px] whitespace-nowrap pl-4 sm:pl-6',
        cellClassName: 'min-w-[90px] align-middle pl-4 sm:pl-6',
        render: (row) => <ProductThumbnail url={row.thumbnailUrl} name={row.name} />,
      },
      {
        key: 'productId',
        label: 'Product ID',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-semibold text-[#246392]">{row.id || '—'}</span>
        ),
      },
      {
        key: 'name',
        label: 'Product Name',
        headerClassName: 'min-w-[220px]',
        cellClassName: 'min-w-[220px] align-middle',
        render: (row) => (
          <div className="truncate font-semibold text-slate-900" title={row.name}>
            {row.name}
          </div>
        ),
      },
      {
        key: 'authorName',
        label: 'Author Name',
        headerClassName: 'min-w-[140px] whitespace-nowrap',
        cellClassName: 'min-w-[140px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="truncate text-sm font-medium text-[#444]" title={row.authorName}>
            {row.authorName || '—'}
          </span>
        ),
      },
      {
        key: 'category',
        label: 'Exam Category',
        headerClassName: 'min-w-[140px] whitespace-nowrap',
        cellClassName: 'min-w-[140px] whitespace-nowrap align-middle',
        render: (row) => (
          <span
            className="inline-flex max-w-[180px] items-center rounded-lg bg-violet-50 px-2.5 py-1 text-[12px] font-semibold text-violet-800 ring-1 ring-violet-500/15"
            title={row.examCategory}
          >
            <span className="truncate">{row.examCategory || '—'}</span>
          </span>
        ),
      },
      {
        key: 'discountPrice',
        label: 'Discount Price',
        align: 'center',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-semibold text-[#7c5cbf]">{formatINR(row.discountPrice)}</span>
        ),
      },
      {
        key: 'stockQuantity',
        label: 'Stock Quantity',
        align: 'center',
        headerClassName: 'min-w-[90px] whitespace-nowrap',
        cellClassName: 'min-w-[90px] whitespace-nowrap align-middle text-center',
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
        render: (row) => <ProductStatusPill status={row.apiStatus || row.status} />,
      },
      createActionsColumn({
        buttonCount: 3,
        align: 'right',
        render: (row) => renderActions(row),
      }),
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
      controlledPagination={controlledPagination}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={1100}
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
