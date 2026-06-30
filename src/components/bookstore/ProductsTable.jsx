import { useMemo } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
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

function FeaturedPill({ featured }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[52px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        featured
          ? 'bg-violet-500/15 text-violet-900 ring-violet-500/25'
          : 'bg-slate-500/10 text-slate-600 ring-slate-500/20',
      )}
    >
      {featured ? 'Yes' : 'No'}
    </span>
  )
}

function SortOrderCell({ value }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-sm text-slate-400">—</span>
  }

  return <span className="font-semibold tabular-nums text-slate-900">{value}</span>
}

function PreviewPdfCell({ url, fileName }) {
  if (!url) {
    return <span className="text-sm text-slate-400">—</span>
  }

  const label = fileName || 'View PDF'

  return (
    <div className="max-w-[200px]">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-center gap-1.5 truncate text-sm font-semibold text-[#246392] hover:underline"
        title={label}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </a>
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
        key: 'thumbnailUrl',
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
        key: 'productName',
        label: 'Product Name',
        headerClassName: 'min-w-[220px]',
        cellClassName: 'min-w-[220px] align-middle',
        render: (row) => (
          <div className="truncate font-semibold text-slate-900" title={row.name}>
            {row.name || '—'}
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
        key: 'originalPrice',
        label: 'Original Price',
        align: 'center',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-semibold text-slate-700">{formatINR(row.originalPrice)}</span>
        ),
      },
      {
        key: 'discountPrice',
        label: 'Discounted Price',
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
            {Number.isFinite(row.stockQuantity) ? row.stockQuantity.toLocaleString() : '—'}
          </span>
        ),
      },
      {
        key: 'previewPdf',
        label: 'Preview PDF',
        headerClassName: 'min-w-[180px]',
        cellClassName: 'min-w-[180px] align-middle',
        render: (row) => (
          <PreviewPdfCell url={row.previewPdf} fileName={row.previewPdfFileName} />
        ),
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle',
        render: (row) => <ProductStatusPill status={row.apiStatus || row.status} />,
      },
      {
        key: 'isFeaturedOnHomepage',
        label: 'Homepage Featured',
        align: 'center',
        headerClassName: 'min-w-[130px] whitespace-nowrap',
        cellClassName: 'min-w-[130px] align-middle text-center',
        render: (row) => <FeaturedPill featured={row.isFeaturedOnHomepage} />,
      },
      {
        key: 'homepageSortOrder',
        label: 'Homepage Order',
        align: 'center',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle text-center',
        render: (row) => <SortOrderCell value={row.homepageSortOrder} />,
      },
      {
        key: 'catalogSortOrder',
        label: 'Catalog Order',
        align: 'center',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle text-center',
        render: (row) => <SortOrderCell value={row.catalogSortOrder} />,
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
