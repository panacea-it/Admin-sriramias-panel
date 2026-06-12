import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { cn } from '../../utils/cn'

export default function ProgramsTable({
  columns,
  data,
  resetDeps,
  emptyMessage,
  loading = false,
  selection,
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#f0f2f5]/60 p-2 sm:p-3">
      <PaginatedFigmaTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage={emptyMessage}
        itemLabel="programs"
        resetDeps={resetDeps}
        selection={selection}
        density="comfortable"
        rowClassName={cn(
          'bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-shadow duration-200',
          'hover:bg-white hover:shadow-[0_4px_16px_rgba(15,23,42,0.1)]',
        )}
        tableClassName={cn(
          'rounded-xl bg-transparent shadow-none',
          '[&_table]:border-separate [&_table]:border-spacing-y-2',
          '[&_thead_tr]:bg-gradient-to-r [&_thead_tr]:from-[#7eb8e8] [&_thead_tr]:to-[#55ace7]',
          '[&_thead_tr]:shadow-[0_2px_8px_rgba(85,172,231,0.25)]',
          '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap',
          '[&_tbody_tr]:rounded-xl [&_tbody_tr]:overflow-hidden',
          '[&_tbody_td]:align-middle',
          '[&_tbody_td:first-child]:rounded-l-xl [&_tbody_td:last-child]:rounded-r-xl',
        )}
        className="rounded-xl bg-transparent shadow-none"
      />
    </div>
  )
}
