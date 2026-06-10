import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Search } from 'lucide-react'
import { cn } from '../../../utils/cn'
import './bookstoreDashboard.css'

export default function BookstoreDashboardDataTable({
  title,
  subtitle,
  columns,
  data = [],
  searchKeys = [],
  searchPlaceholder = 'Search…',
  filterOptions = [],
  filterKey,
  onExport,
  emptyMessage = 'No records found.',
  minTableWidth = 1200,
  maxHeight = 'max-h-[500px]',
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  const filtered = useMemo(() => {
    let rows = [...data]
    const q = query.trim().toLowerCase()
    if (q) {
      rows = rows.filter((row) =>
        searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)),
      )
    }
    if (filterKey && filter !== 'all') {
      rows = rows.filter((row) => String(row[filterKey]) === filter)
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av
        }
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      })
    }
    return rows
  }, [data, query, searchKeys, filter, filterKey, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#eef0f4] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
    >
      <div className="sticky top-0 z-20 border-b border-[#eef0f4] bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#111] sm:text-lg">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-[#686868]">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {searchKeys.length > 0 && (
              <div className="relative flex-1 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full min-w-[200px] rounded-xl border border-[#e8eaed] py-2 pl-10 pr-3 text-sm outline-none focus:border-[#7c5cbf] focus:ring-2 focus:ring-[#7c5cbf]/20 sm:min-w-[240px]"
                />
              </div>
            )}
            {filterOptions.length > 0 && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-[#e8eaed] bg-white px-3 py-2 text-sm font-medium text-[#111] outline-none focus:border-[#7c5cbf]"
              >
                <option value="all">All statuses</option>
                {filterOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8eaed] bg-[#fafafa] px-3 py-2 text-sm font-semibold text-[#111] transition hover:border-[#7c5cbf]/40 hover:bg-white"
              >
                <Download className="h-4 w-4 text-[#7c5cbf]" />
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'bookstore-dash-scroll w-full overflow-x-auto overflow-y-auto px-1 pb-1',
          maxHeight,
        )}
      >
        <table
          className="w-full border-collapse text-left text-sm"
          style={{ minWidth: minTableWidth }}
        >
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#55ace7] to-[#246392] text-white shadow-md">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wide sm:text-sm',
                    col.className,
                    col.sortable && 'cursor-pointer select-none hover:bg-white/10',
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="ml-1 opacity-80">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center text-sm text-[#686868]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row, ri) => (
                <tr
                  key={row.id ?? ri}
                  className={cn(
                    'border-b border-[#f0f2f5] transition-colors hover:bg-[#7c5cbf]/[0.06]',
                    ri % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'whitespace-nowrap px-5 py-4 text-sm text-[#111]',
                        col.cellClassName,
                      )}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[#eef0f4] bg-[#fafafa] px-4 py-3 text-sm text-[#686868] sm:px-6">
        Showing <strong className="text-[#111]">{filtered.length}</strong> of{' '}
        <strong className="text-[#111]">{data.length}</strong> records
      </div>
    </motion.div>
  )
}
