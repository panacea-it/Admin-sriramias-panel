import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { cn } from '../../utils/cn'

const TABLE_CLASS = cn(
  'rounded-none border-0 shadow-none',
  '[&_thead_tr]:!bg-gradient-to-r [&_thead_tr]:!from-[#7eb8e8] [&_thead_tr]:!to-[#55ace7]',
  '[&_thead_tr]:shadow-[0_2px_8px_rgba(85,172,231,0.25)]',
  '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap [&_thead_th]:!bg-transparent',
  '[&_thead_th]:text-white [&_thead_th]:text-xs [&_thead_th]:font-semibold sm:[&_thead_th]:text-sm',
  '[&_tbody_td]:align-middle',
)

export default function YoutubeVideosTable({
  columns,
  data,
  emptyMessage = 'No youtube videos found.',
  itemLabel = 'videos',
  initialPageSize = 6,
  resetDeps = [],
  rowClassName,
}) {
  const tableMinWidth = useMemo(
    () => columns.reduce((sum, col) => sum + (col.width || 120), 0),
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
      density="comfortable"
      tableMinWidth={tableMinWidth}
      tableLayoutFixed
      gradientActivePage
      rowClassName={rowClassName ?? 'hover:bg-[#eef6fc]/70'}
      className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
      tableClassName={TABLE_CLASS}
      paginationClassName="border-t border-[#E5E7EB] bg-white"
      zebraStriping
    />
  )
}
