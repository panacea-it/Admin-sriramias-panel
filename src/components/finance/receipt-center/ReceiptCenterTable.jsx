import { Eye, Download, Send, ChevronDown, ChevronUp } from 'lucide-react'
import ReceiptStatusBadge from './ReceiptStatusBadge'
import CommunicationStatusChips from './CommunicationStatusChips'
import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

export default function ReceiptCenterTable({
  rows,
  onSendReceipt,
  onPreview,
  onDownload,
  canSend = true,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  sortKey = 'receiptGeneratedAt',
  sortDir = 'desc',
  onSort,
  page = 1,
  pageSize = 20,
  onPageChange,
}) {
  const paginated = rows.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const allSelected = paginated.length > 0 && paginated.every((r) => selectedIds.includes(r.id))

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return null
    return sortDir === 'asc' ? <ChevronUp className="inline h-3 w-3" /> : <ChevronDown className="inline h-3 w-3" />
  }

  const thClass = 'px-3 py-3 cursor-pointer select-none hover:bg-white/10'

  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
      <div className="max-h-[min(560px,65vh)] overflow-auto">
        <table className="w-full min-w-[1280px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#246392] to-[#1a4d73] text-left text-[11px] font-bold uppercase tracking-wide text-white">
            <tr>
              {canSend && onToggleSelectAll && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    className="h-4 w-4 rounded"
                    aria-label="Select all receipts on page"
                  />
                </th>
              )}
              <th className={thClass} onClick={() => onSort?.('receiptNumber')}>
                Receipt # <SortIcon col="receiptNumber" />
              </th>
              <th className={thClass} onClick={() => onSort?.('invoiceNumber')}>
                Invoice # <SortIcon col="invoiceNumber" />
              </th>
              <th className={thClass} onClick={() => onSort?.('studentName')}>
                Student <SortIcon col="studentName" />
              </th>
              <th className={thClass} onClick={() => onSort?.('branchCode')}>
                Branch <SortIcon col="branchCode" />
              </th>
              <th className="px-3 py-3">Course</th>
              <th className="px-3 py-3">Payment mode</th>
              <th className={cn(thClass, 'text-right')} onClick={() => onSort?.('gstAmount')}>
                GST <SortIcon col="gstAmount" />
              </th>
              <th className={cn(thClass, 'text-right')} onClick={() => onSort?.('totalAmount')}>
                Total <SortIcon col="totalAmount" />
              </th>
              <th className={cn(thClass, 'text-center')} onClick={() => onSort?.('receiptLifecycleStatus')}>
                Status <SortIcon col="receiptLifecycleStatus" />
              </th>
              <th className={thClass} onClick={() => onSort?.('receiptGeneratedAt')}>
                Generated <SortIcon col="receiptGeneratedAt" />
              </th>
              <th className="px-3 py-3">Communication</th>
              <th className="sticky right-0 z-20 bg-[#1a4d73] px-3 py-3 text-center shadow-[-4px_0_8px_rgba(0,0,0,0.12)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  'border-t border-slate-100 transition-colors hover:bg-[#f8fbff]',
                  idx % 2 === 1 && 'bg-slate-50/70',
                  selectedIds.includes(row.id) && 'bg-[#eef6fc]/60',
                )}
              >
                {canSend && onToggleSelect && (
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => onToggleSelect(row.id)}
                      className="h-4 w-4 rounded"
                      aria-label={`Select ${row.receiptNumber}`}
                    />
                  </td>
                )}
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-semibold text-[#246392]">
                  {row.receiptNumber}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-[#555]">
                  {row.invoiceNumber || '—'}
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-semibold text-[#222]">{row.studentName}</p>
                  <p className="text-[10px] text-[#888]">{row.mobile || row.studentId}</p>
                </td>
                <td className="px-3 py-2.5">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-[#444]">
                    {row.branchCode || '—'}
                  </span>
                </td>
                <td className="max-w-[140px] truncate px-3 py-2.5 text-[#333]" title={row.courseName}>
                  {row.courseName}
                </td>
                <td className="px-3 py-2.5 text-[#333]">{row.paymentMode || '—'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[#555]">
                  {formatINR(row.gstAmount ?? 0)}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-[#111]">
                  {formatINR(row.totalAmount ?? row.amountPaid)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ReceiptStatusBadge status={row.receiptLifecycleStatus} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-[#555]">
                  {row.receiptGeneratedAt || row.paymentDate
                    ? formatCategoryDateTime(row.receiptGeneratedAt || row.paymentDate)
                    : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <CommunicationStatusChips communications={row.communications} compact />
                </td>
                <td
                  className={cn(
                    'sticky right-0 border-l border-slate-100 bg-white px-2 py-2.5',
                    idx % 2 === 1 && 'bg-slate-50/95',
                  )}
                >
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      title="Preview receipt"
                      onClick={() => onPreview?.(row)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-[#444] hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Download receipt"
                      onClick={() => onDownload?.(row)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-[#444] hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    {canSend && (
                      <button
                        type="button"
                        title="Send receipt"
                        onClick={() => onSendReceipt(row)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-2.5 text-[10px] font-bold text-white"
                      >
                        <Send className="h-3 w-3" />
                        Send
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="py-12 text-center text-sm text-[#686868]">
          No completed payment receipts match your filters.
        </p>
      )}

      {rows.length > pageSize && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-[#686868]">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2 py-1 tabular-nums">{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
