import { cn } from '../../utils/cn'
import LoadingState from '../feedback/LoadingState'
import EmptyState from '../feedback/EmptyState'
import Pagination from './Pagination'

export default function DataTable({
  columns,
  data,
  loading,
  emptyTitle,
  page = 1,
  totalPages = 1,
  onPageChange,
  className,
}) {
  if (loading) return <LoadingState message="Loading records..." />

  if (!data?.length) {
    return <EmptyState title={emptyTitle || 'No records found'} />
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white', className)}>
      <div className="table-responsive">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-slate-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-text-sub)] sm:px-5"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-slate-50/60 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 text-[var(--color-text-main)] sm:px-5">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  )
}
