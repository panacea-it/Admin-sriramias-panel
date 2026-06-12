import { AlertTriangle } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import PaymentAttemptFailureBadge from './PaymentAttemptFailureBadge'
import FinanceStatusBadge from '../FinanceStatusBadge'
import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

function DetailItem({ label, children, className }) {
  return (
    <div className={className}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#686868]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[#1a3a5c]">{children}</dd>
    </div>
  )
}

export default function PaymentAttemptFailureModal({ open, row, onClose }) {
  if (!row) return null

  const raw =
    row.gatewayResponseRaw ||
    (typeof row.gatewayResponse === 'string'
      ? row.gatewayResponse
      : row.gatewayResponse
        ? JSON.stringify(row.gatewayResponse, null, 2)
        : '')

  const humanReason = row.gatewayMessage || row.failureReason || 'No additional details from the gateway.'
  const attemptLabel = row.attemptId || row.id

  return (
    <Modal open={open} onClose={onClose} size="md" title="Failure details" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title="Payment failure details"
          subtitle={`${row.student || 'Student'} · ${row.course || 'Course'}`}
          onClose={onClose}
          icon={AlertTriangle}
          iconClassName="text-amber-500"
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="space-y-4 p-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <PaymentAttemptFailureBadge category={row.failureCategory} rawMessage={humanReason} />
            <FinanceStatusBadge status={row.status || 'Failed'} />
          </div>

          <div className="rounded-lg border border-slate-100 bg-[#eef6fc]/40 p-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Attempt ID">
                <span className="font-mono text-xs">{attemptLabel}</span>
              </DetailItem>
              <DetailItem label="Transaction ID">
                <span className="font-mono text-xs">{row.transactionId || '—'}</span>
              </DetailItem>
              <DetailItem label="Amount">{formatINR(row.amount ?? 0)}</DetailItem>
              <DetailItem label="Payment mode">{row.paymentMode || '—'}</DetailItem>
              <DetailItem label="Gateway">{row.gatewayProvider || row.gatewayStatus || '—'}</DetailItem>
              <DetailItem label="Error code">{row.errorCode || '—'}</DetailItem>
              <DetailItem label="Retry count">{row.retryCount ?? 0}</DetailItem>
              <DetailItem label="Attempt time">{formatCategoryDateTime(row.lastAttemptDate || row.dateTime)}</DetailItem>
            </dl>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#686868]">
              Human-readable reason
            </p>
            <p
              className={cn(
                'rounded-lg border px-3 py-2.5 text-sm leading-relaxed',
                row.failureCategory
                  ? 'border-amber-200 bg-amber-50 text-amber-950'
                  : 'border-slate-200 bg-slate-50 text-[#222]',
              )}
            >
              {humanReason}
            </p>
          </div>

          {raw ? (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#686868]">
                Raw gateway response
              </p>
              <pre className="max-h-40 overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
                {raw}
              </pre>
            </div>
          ) : null}

          <div className="flex justify-end border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
