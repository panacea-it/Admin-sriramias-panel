import { Download, Eye, Pencil, Send } from 'lucide-react'
import ReceiptStatusBadge from './ReceiptStatusBadge'
import CommunicationStatusChips from './CommunicationStatusChips'
import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

export default function ReceiptMobileCards({
  rows,
  selectedIds = [],
  onToggleSelect,
  onPreview,
  onSendReceipt,
  onEditReceipt,
  canSend = true,
  canEdit = true,
}) {
  if (!rows.length) return null

  return (
    <div className="space-y-3 lg:hidden">
      {rows.map((row) => {
        const selected = selectedIds.includes(row.id)
        return (
          <article
            key={row.id}
            className={cn(
              'rounded-xl border bg-white p-4 shadow-sm transition',
              selected ? 'border-[#55ace7] ring-2 ring-[#55ace7]/20' : 'border-slate-200',
            )}
          >
            <div className="flex items-start gap-3">
              {canSend && onToggleSelect && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleSelect(row.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                  aria-label={`Select receipt ${row.receiptNumber}`}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs font-bold text-[#246392]">{row.receiptNumber}</p>
                  <ReceiptStatusBadge status={row.receiptLifecycleStatus} />
                </div>
                <p className="mt-1 font-semibold text-[#222]">{row.studentName}</p>
                <p className="text-xs text-[#686868]">{row.courseName} · {row.branchCode}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#555]">
                  <span>{formatINR(row.totalAmount ?? row.amountPaid)}</span>
                  <span>GST {formatINR(row.gstAmount ?? 0)}</span>
                  <span>{row.paymentMode}</span>
                </div>
                <p className="mt-1 text-[10px] text-[#888]">
                  {row.receiptGeneratedAt || row.paymentDate
                    ? formatCategoryDateTime(row.receiptGeneratedAt || row.paymentDate)
                    : '—'}
                </p>
                <div className="mt-2">
                  <CommunicationStatusChips communications={row.communications} compact />
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => onPreview?.(row)}
                title="Preview receipt"
                aria-label="Preview receipt"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#444] hover:bg-slate-50"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              {canSend && (
                <button
                  type="button"
                  onClick={() => onSendReceipt?.(row)}
                  title="Send receipt"
                  aria-label="Send receipt"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] text-white hover:opacity-90"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onPreview?.(row, 'download')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#444]"
                aria-label="Download receipt"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              {canEdit && onEditReceipt && (
                <button
                  type="button"
                  title="Edit receipt"
                  aria-label="Edit receipt"
                  onClick={() => onEditReceipt(row)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#55ace7]/30 text-[#246392] hover:bg-[#eef6fc]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
