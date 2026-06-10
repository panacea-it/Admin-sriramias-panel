import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { cn } from '../../../utils/cn'
import './bookstoreDashboard.css'

export default function BookstoreDashboardScrollTable({
  title,
  subtitle,
  columns,
  data = [],
  searchKeys = [],
  searchPlaceholder = 'Search…',
  maxHeight = 'max-h-[340px]',
  emptyMessage = 'No records found.',
  headerActions,
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)),
    )
  }, [data, query, searchKeys])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#eef0f4] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#111] sm:text-base">{title}</h3>
          {subtitle && <p className="text-xs text-[#686868]">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {searchKeys.length > 0 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca0a8]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full min-w-[140px] rounded-lg border border-[#e8eaed] py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#7c5cbf] focus:ring-1 focus:ring-[#7c5cbf]/25 sm:min-w-[180px]"
              />
            </div>
          )}
          {headerActions}
        </div>
      </div>

      <div className={cn('bookstore-dash-scroll w-full overflow-x-auto overflow-y-auto', maxHeight)}>
        <table className="min-w-full w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#55ace7] to-[#246392] text-white shadow-sm">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-xs font-semibold sm:px-5 sm:text-sm',
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-[#686868]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row, ri) => (
                <motion.tr
                  key={row.id ?? ri}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: ri * 0.03 }}
                  className="border-b border-[#f0f2f5] transition-colors hover:bg-[#7c5cbf]/5"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'whitespace-nowrap px-4 py-3.5 text-[#111] sm:px-5',
                        col.cellClassName,
                      )}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="border-t border-[#eef0f4] px-4 py-2 text-xs text-[#686868] sm:px-5">
          Showing {filtered.length} of {data.length} records
        </div>
      )}
    </motion.div>
  )
}
