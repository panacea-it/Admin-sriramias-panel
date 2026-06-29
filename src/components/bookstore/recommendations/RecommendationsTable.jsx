import { useMemo } from 'react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import BookstoreStatusBadge from '../BookstoreStatusBadge'
import { createActionsColumn } from '../../../utils/tableColumnHelpers'
import { cn } from '../../../utils/cn'
import { productDisplayName } from '../../../utils/bookstoreRecommendationUtils'
import { formatBookstoreDate } from '../../../utils/formatDateTime'

function recommendationDisplayDate(rule) {
  return formatBookstoreDate(rule.createdAt || rule.updatedAt)
}

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
        key: 'status',
        label: 'Status',
        align: 'center',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle text-center',
        render: (row) => <BookstoreStatusBadge status={row.status} />,
      },
      {
        key: 'date',
        label: 'Date',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-semibold tabular-nums text-[#111]">
            {recommendationDisplayDate(row)}
          </span>
        ),
      },
      createActionsColumn({
        buttonCount: 3,
        align: 'right',
        render: (row) => renderActions(row),
      }),
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
