import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { cn } from '../../utils/cn'
import { getTop10RowClassName } from './rankManagementDisplay'

const TABLE_CLASS = cn(
  'rounded-none border-0 shadow-none',
  '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap',
  '[&_thead_th_span]:overflow-visible [&_thead_th_span]:text-clip',
)

export default function RankManagementTable({
  columns,
  data,
  emptyMessage = 'No Toppers Found',
  itemLabel = 'toppers',
  initialPageSize = 6,
  resetDeps = [],
  loading = false,
}) {
  const tableMinWidth = useMemo(
    () => columns.reduce((sum, col) => sum + (Number(col.width) || 120), 0),
    [columns],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      itemLabel={itemLabel}
      initialPageSize={initialPageSize}
      resetDeps={resetDeps}
      loading={loading}
      skeletonRowCount={8}
      density="compact"
      rowClassName="hover:bg-[#eef6fc]/70"
      getRowClassName={getTop10RowClassName}
      tableClassName={TABLE_CLASS}
      tableMinWidth={tableMinWidth}
      tableLayoutFixed
      gradientActivePage
      className="min-w-0 rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
      paginationClassName={cn(
        'border-t border-[#E5E7EB] bg-white',
        '[&>div:last-child]:items-center',
        '[&_nav]:items-center',
        '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
        '[&_form_input]:h-9 [&_form_input]:leading-none',
        '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
      )}
      zebraStriping
    />
  )
}
