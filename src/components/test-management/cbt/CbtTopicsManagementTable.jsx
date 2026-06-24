import { useMemo } from 'react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { cn } from '../../../utils/cn'
import { createActionsColumn } from '../../../utils/tableColumnHelpers'

const OVERFLOW_CELL = 'min-w-0 max-w-0 overflow-hidden align-middle'

function formatLastUpdated(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function CbtTopicsManagementTable({
  topics,
  loading,
  resetDeps = [],
  emptyMessage,
  emptyState,
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Topic',
        width: '40%',
        headerClassName: OVERFLOW_CELL,
        cellClassName: OVERFLOW_CELL,
        render: (row) => (
          <div className="min-w-0">
            <span
              className="block truncate font-semibold text-slate-900"
              title={row.title || ''}
            >
              {row.title || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'testCount',
        label: 'Test Series',
        width: '20%',
        align: 'center',
        headerClassName: cn(OVERFLOW_CELL, 'whitespace-nowrap text-center'),
        cellClassName: cn(OVERFLOW_CELL, 'whitespace-nowrap text-center'),
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">{row.testCount ?? 0}</span>
        ),
      },
      {
        key: 'updatedAt',
        label: 'Last Updated',
        width: '25%',
        headerClassName: cn(OVERFLOW_CELL, 'whitespace-nowrap'),
        cellClassName: cn(OVERFLOW_CELL, 'whitespace-nowrap'),
        render: (row) => (
          <span className="whitespace-nowrap font-medium text-[#686868]">
            {formatLastUpdated(row.updatedAt)}
          </span>
        ),
      },
      createActionsColumn({
        buttonCount: 1,
        align: 'center',
        render: (row) => renderActions(row),
      }),
    ],
    [renderActions],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={topics}
      emptyMessage={emptyMessage}
      emptyState={emptyState}
      itemLabel="records"
      loading={loading}
      skeletonRowCount={8}
      initialPageSize={10}
      resetDeps={resetDeps}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={0}
      tableLayoutFixed
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
