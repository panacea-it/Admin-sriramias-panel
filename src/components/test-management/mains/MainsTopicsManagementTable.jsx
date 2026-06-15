import { useMemo } from 'react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { cn } from '../../../utils/cn'

export default function MainsTopicsManagementTable({
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
        width: '45%',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'min-w-[200px] align-middle',
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
        label: 'Tests / PDFs',
        width: '20%',
        align: 'center',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">{row.testCount ?? 0}</span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        width: '35%',
        align: 'center',
        headerClassName: 'min-w-[160px] whitespace-nowrap',
        cellClassName: 'min-w-[160px] whitespace-nowrap align-middle',
        render: (row) => renderActions(row),
      },
    ],
    [renderActions],
  )

  return (
    <PaginatedFigmaTable
      className="w-full"
      columns={columns}
      data={topics}
      emptyMessage={emptyMessage}
      emptyState={emptyState}
      itemLabel="topics"
      loading={loading}
      skeletonRowCount={8}
      initialPageSize={10}
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
