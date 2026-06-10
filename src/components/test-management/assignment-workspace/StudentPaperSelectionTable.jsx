import { cn } from '../../../utils/cn'
import PaperEvaluationStatusBadge from '../evaluation-oversight/PaperEvaluationStatusBadge'
import { formatRelativeTime } from '../../../utils/formatRelativeTime'

function StudentAvatar({ name }) {
  const initials = String(name || '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2fc] text-xs font-bold text-[#1a3a5c]">
      {initials}
    </span>
  )
}

export default function StudentPaperSelectionTable({
  papers,
  testName,
  selectedIds,
  onToggle,
  onToggleAll,
  statusFilter,
  onStatusFilterChange,
  onBulkSelectAll,
  loading,
}) {
  const allSelected = papers.length > 0 && papers.every((p) => selectedIds.includes(p.id))
  const someSelected = papers.some((p) => selectedIds.includes(p.id))

  return (
    <article className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--card-shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-bold text-[#1a3a5c]">Student Paper Selection</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Showing {papers.length} pending papers{testName ? ` for ${testName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBulkSelectAll}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#1a3a5c] shadow-sm hover:bg-slate-50"
          >
            Bulk Action
          </button>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#1a3a5c] outline-none focus:ring-2 focus:ring-[#55ace7]/30"
          >
            <option value="all">Filter Status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className={cn('min-h-0 flex-1 overflow-auto', loading && 'opacity-60')}>
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead className="sticky top-0 z-[1] bg-[#1a3a5c] text-white">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected
                  }}
                  onChange={() => onToggleAll(!allSelected)}
                  className="h-4 w-4 accent-[#55ace7]"
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Student Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Roll Number</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Current Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {papers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No pending papers for this selection.
                </td>
              </tr>
            ) : (
              papers.map((row, idx) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-slate-100 text-sm',
                    idx % 2 === 1 && 'bg-slate-50/80',
                    selectedIds.includes(row.id) && 'bg-[#eef6fc]/60',
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => onToggle(row.id)}
                      className="h-4 w-4 accent-[#55ace7]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-semibold text-[#1a3a5c]">
                      <StudentAvatar name={row.studentName} />
                      {row.studentName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{row.rollNumber}</td>
                  <td className="px-4 py-3">
                    <PaperEvaluationStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 italic text-slate-500">
                    {formatRelativeTime(row.lastUpdate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}
