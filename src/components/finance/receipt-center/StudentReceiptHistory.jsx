import { useMemo, useState } from 'react'
import { Download, Eye, Send } from 'lucide-react'
import FinanceTimeline from '../FinanceTimeline'
import FinanceSearchInput from '../FinanceSearchInput'
import ReceiptStatusBadge from './ReceiptStatusBadge'
import FinanceEmptyState from '../FinanceEmptyState'
import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { buildStudentReceiptHistory } from '../../../utils/receiptCompletion'

export default function StudentReceiptHistory({
  payments = [],
  studentId,
  onPreview,
  onDownload,
  onResend,
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')

  const receipts = useMemo(
    () => buildStudentReceiptHistory(payments, studentId),
    [payments, studentId],
  )

  const filtered = useMemo(() => {
    let list = receipts
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          (r.receiptNumber || '').toLowerCase().includes(q) ||
          (r.invoiceNumber || '').toLowerCase().includes(q),
      )
    }
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.receiptLifecycleStatus === statusFilter)
    }
    if (modeFilter !== 'all') {
      list = list.filter((r) => r.paymentMode === modeFilter)
    }
    return list
  }, [receipts, search, statusFilter, modeFilter])

  const timelineEvents = useMemo(
    () =>
      filtered.flatMap((r) => {
        const events = [
          {
            step: `Receipt ${r.receiptNumber}`,
            detail: `${r.paymentTypeLabel} · ${formatINR(r.amountPaid)}`,
            timestamp: r.receiptGeneratedAt || r.paymentDate,
            status: 'completed',
          },
        ]
        if (r.receiptSentAt) {
          events.push({
            step: 'Receipt sent',
            detail: r.receiptSentBy || 'Finance',
            timestamp: r.receiptSentAt,
            status: 'completed',
          })
        }
        ;(r.receiptAudit?.resendHistory || []).forEach((h) => {
          events.push({
            step: `Resent via ${h.channel}`,
            detail: h.status,
            timestamp: h.sentAt,
            status: h.status === 'Failed' ? 'failed' : 'completed',
          })
        })
        return events
      }),
    [filtered],
  )

  const paymentModes = [...new Set(receipts.map((r) => r.paymentMode).filter(Boolean))]

  if (!receipts.length) {
    return (
      <FinanceEmptyState
        title="No receipts yet"
        description="Receipts appear here after successful payments."
        className="py-8"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <FinanceSearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search receipt #…"
          inputClassName="h-9 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="Generated">Generated</option>
          <option value="Sent">Sent</option>
          <option value="Downloaded">Downloaded</option>
          <option value="Failed">Failed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
          aria-label="Filter by payment mode"
        >
          <option value="all">All payment modes</option>
          {paymentModes.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <ul className="space-y-2">
        {filtered.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-sm shadow-sm"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#246392]">{r.receiptNumber}</span>
                <ReceiptStatusBadge status={r.receiptLifecycleStatus} />
                <span className="text-[10px] text-[#888]">{r.paymentTypeLabel}</span>
              </div>
              <p className="text-xs text-[#686868]">
                {formatINR(r.amountPaid)} · {r.paymentMode} ·{' '}
                {formatCategoryDateTime(r.receiptGeneratedAt || r.paymentDate)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                title="Preview"
                onClick={() => onPreview?.(r)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-[#444] hover:bg-slate-50"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Download"
                onClick={() => onDownload?.(r)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-[#444] hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Resend"
                onClick={() => onResend?.(r)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#246392]/30 bg-[#eef6fc] text-[#246392]"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {timelineEvents.length > 0 && (
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#246392]">Receipt timeline</p>
          <FinanceTimeline events={timelineEvents.slice(0, 12)} />
        </div>
      )}
    </div>
  )
}
