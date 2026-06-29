import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { cn } from '../../utils/cn'

/** Minimum width before horizontal scroll kicks in */
const BLOG_TABLE_MIN_WIDTH = 1530

const BLOG_TABLE_CLASS = cn(
  'w-full min-w-full rounded-none border-0 shadow-none',
  '[&_table]:relative [&_table]:z-[1] [&_table]:w-full [&_table]:min-w-full',
  '[&_thead_th]:relative [&_thead_th]:z-[1] [&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap',
  '[&_thead_th]:!bg-transparent [&_thead_th]:text-white',
  '[&_tbody_td]:align-middle',
  '[&_tbody_td[data-fill-column]]:p-0',
)

export default function BlogManagementTable({
  columns,
  data,
  emptyMessage = 'No Blogs Found',
  itemLabel = 'blogs',
  initialPageSize = 10,
  resetDeps = [],
  loading = false,
  controlledPagination,
}) {
  return (
    <PaginatedFigmaTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      itemLabel={itemLabel}
      initialPageSize={initialPageSize}
      resetDeps={resetDeps}
      loading={loading}
      controlledPagination={controlledPagination}
      skeletonRowCount={3}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName={BLOG_TABLE_CLASS}
      tableMinWidth={BLOG_TABLE_MIN_WIDTH}
      tableLayoutFixed
      headerFillColumn
      suppressInnerScroll
      gradientActivePage
      className="w-full min-w-0 overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
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
