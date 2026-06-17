import { useMemo } from 'react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import BookstoreStatusBadge from '../BookstoreStatusBadge'
import { cn } from '../../../utils/cn'
import { productDisplayName } from '../../../utils/bookstoreRecommendationUtils'

export default function RecommendationsTable({
  rules,
  products,
  loading = false,
  resetDeps = [],
  onSourceClick,
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'sourceProductId',
        label: 'Source Book',
        headerClassName: 'min-w-[180px] pl-4 sm:pl-6',
        cellClassName: 'min-w-[180px] align-middle pl-4 sm:pl-6',
        render: (row) => {
          const name = productDisplayName(products, row.sourceProductId)
          return (
            <button
              type="button"
              onClick={() => onSourceClick?.(row)}
              className="block max-w-[220px] truncate text-left font-semibold text-slate-900 transition hover:text-[#246392]"
              title={name}
            >
              {name}
            </button>
          )
        },
      },
      {
        key: 'recommendationType',
        label: 'Type',
        headerClassName: 'min-w-[160px] whitespace-nowrap',
        cellClassName: 'min-w-[160px] align-middle',
        render: (row) => (
          <span className="text-[13px] font-medium text-[#111]">
            {row.recommendationType || row.type}
          </span>
        ),
      },
      {
        key: 'recommendedProductIds',
        label: 'Recommended Books',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'min-w-[200px] align-middle',
        render: (row) => {
          const ids = row.recommendedProductIds || row.targetProductIds || []
          const names = ids.map((id) => productDisplayName(products, id)).join(' · ')
          return (
            <span className="block max-w-[260px] truncate text-[13px] text-[#444]" title={names}>
              {names || '—'}
            </span>
          )
        },
      },
      {
        key: 'placement',
        label: 'Placement',
        headerClassName: 'min-w-[130px] whitespace-nowrap',
        cellClassName: 'min-w-[130px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="inline-flex items-center rounded-lg bg-violet-50 px-2.5 py-1 text-[12px] font-semibold text-violet-800 ring-1 ring-violet-500/15">
            {row.placement}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle text-center',
        render: (row) => <BookstoreStatusBadge status={row.status} />,
      },
      {
        key: 'priorityOrder',
        label: 'Priority',
        align: 'center',
        headerClassName: 'min-w-[90px] whitespace-nowrap',
        cellClassName: 'min-w-[90px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-semibold tabular-nums text-[#111]">{row.priorityOrder ?? '—'}</span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[280px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[280px] whitespace-nowrap align-middle pr-4 sm:pr-6',
        render: (row) => renderActions(row),
      },
    ],
    [products, onSourceClick, renderActions],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={rules}
      itemLabel="rules"
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
