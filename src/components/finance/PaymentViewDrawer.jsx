import { Download, MessageCircle, Printer, Send } from 'lucide-react'
import FinanceSlideDrawer from './FinanceSlideDrawer'
import FinanceStatusBadge from './FinanceStatusBadge'
import FinanceRefundBadge from './FinanceRefundBadge'
import FinanceAccessStatusBadge from './FinanceAccessStatusBadge'
import FinanceTimeline from './FinanceTimeline'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-xs font-medium text-[#686868] sm:text-sm">{label}</span>
      <span className="text-sm font-semibold text-[#111] sm:text-right">{value ?? '—'}</span>
    </div>
  )
}

export default function PaymentViewDrawer({
  open,
  onClose,
  payment,
  onDownloadReceipt,
  onPrintReceipt,
  onResendReceipt,
  onWhatsAppReceipt,
  canReceipts = true,
}) {
  if (!payment) return null

  const receiptFooter = canReceipts ? (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onDownloadReceipt?.(payment)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a5c] px-3 py-2 text-sm font-semibold text-white hover:bg-[#152f4a]"
      >
        <Download className="h-4 w-4" /> Download
      </button>
      <button
        type="button"
        onClick={() => onPrintReceipt?.(payment)}
        className="inline-flex items-center gap-2 rounded-lg border border-[#246392] px-3 py-2 text-sm font-semibold text-[#246392] hover:bg-[#eef6fc]"
      >
        <Printer className="h-4 w-4" /> Print
      </button>
      <button
        type="button"
        onClick={() => onResendReceipt?.(payment)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#111] hover:bg-slate-50"
      >
        <Send className="h-4 w-4" /> Resend
      </button>
      <button
        type="button"
        onClick={() => onWhatsAppReceipt?.(payment)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#69df66] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </button>
    </div>
  ) : null

  return (
    <FinanceSlideDrawer
      open={open}
      onClose={onClose}
      title={payment.studentName}
      subtitle={`${payment.id} · ${payment.courseName}`}
      width="max-w-2xl"
      footer={receiptFooter}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <FinanceStatusBadge status={payment.paymentStatus} />
          <FinanceRefundBadge status={payment.refundStatus} className="rounded-full px-3 py-1 text-xs" />
          <FinanceAccessStatusBadge status={payment.accessStatus} className="rounded-full px-3 py-1 text-xs" />
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {payment.paymentType}
          </span>
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-4">
          <DetailRow label="Student ID" value={payment.studentId} />
          <DetailRow label="Enrollment" value={payment.enrollmentNumber} />
          <DetailRow label="Mobile" value={payment.mobile} />
          <DetailRow label="Email" value={payment.email} />
          <DetailRow label="Branch" value={payment.branch} />
          <DetailRow label="Payment mode" value={payment.paymentMode || '—'} />
          <DetailRow label="Payment gateway" value={payment.paymentGateway || '—'} />
          <DetailRow label="Transaction ID" value={payment.transactionId || '—'} />
          <DetailRow label="Payment date" value={formatCategoryDateTime(payment.paymentDate)} />
          <DetailRow label="Amount paid" value={formatINR(payment.amountPaid)} />
          <DetailRow label="Pending" value={formatINR(payment.pendingAmount)} />
          <DetailRow label="Total fees" value={formatINR(payment.totalFees)} />
          <DetailRow label="GST" value={formatINR(payment.gst)} />
          <DetailRow label="Receipt" value={payment.receiptNumber || 'Not generated'} />
        </div>

        {(payment.studentTimeline?.length > 0 || payment.timeline?.length > 0) && (
          <div>
            <h3 className="mb-3 text-sm font-bold text-[#246392]">Student payment timeline</h3>
            <FinanceTimeline events={payment.studentTimeline || []} />
          </div>
        )}

        {payment.timeline?.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-bold text-[#246392]">Payment events</h3>
            <ul className="space-y-2">
              {payment.timeline.map((ev, i) => (
                <li
                  key={`${ev.event}-${i}`}
                  className="flex items-start justify-between gap-3 rounded-md border border-slate-100 bg-white px-3 py-2 text-sm"
                >
                  <span className="font-medium">{ev.event}</span>
                  <span className="shrink-0 text-xs text-[#686868]">{formatCategoryDateTime(ev.timestamp)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {payment.attempts?.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-bold text-[#246392]">Payment attempts</h3>
            <div className="overflow-x-auto rounded-md border border-slate-100">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-[#eef6fc] text-xs font-semibold text-[#246392]">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Txn ID</th>
                    <th className="px-3 py-2">Mode</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Gateway</th>
                    <th className="px-3 py-2">Failure</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payment.attempts.map((a) => (
                    <tr key={a.attemptNo} className="border-t border-slate-100">
                      <td className="px-3 py-2">{a.attemptNo}</td>
                      <td className="px-3 py-2 font-mono text-xs">{a.transactionId}</td>
                      <td className="px-3 py-2">{a.paymentMode}</td>
                      <td className="px-3 py-2">
                        <FinanceStatusBadge status={a.status} />
                      </td>
                      <td className="px-3 py-2 text-xs">{a.gatewayResponse}</td>
                      <td className="px-3 py-2 text-xs text-[#686868]">{a.failureReason || '—'}</td>
                      <td className="px-3 py-2 text-xs text-[#686868]">{formatCategoryDateTime(a.dateTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {payment.adminLogs?.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-bold text-[#246392]">Admin logs</h3>
            <ul className="space-y-2">
              {payment.adminLogs.map((log, i) => (
                <li key={i} className="rounded-md border border-slate-100 bg-white p-3 text-sm">
                  <p className="font-semibold">{log.action}</p>
                  <p className="text-xs text-[#686868]">
                    {log.adminName} · {formatCategoryDateTime(log.timestamp)}
                  </p>
                  {log.comment && <p className="mt-1 text-[#444]">{log.comment}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </FinanceSlideDrawer>
  )
}
