import Modal from '../../ui/Modal'
import PaymentAttemptFailureBadge from './PaymentAttemptFailureBadge'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function PaymentAttemptFailureModal({ open, row, onClose }) {
  if (!row) return null
  const raw = row.gatewayResponseRaw || (typeof row.gatewayResponse === 'string' ? row.gatewayResponse : JSON.stringify(row.gatewayResponse, null, 2))

  return (
    <Modal open={open} onClose={onClose} size="md" title="Failure details">
      <div className="space-y-4 p-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[#686868]">Category:</span>
          <PaymentAttemptFailureBadge category={row.failureCategory} rawMessage={row.gatewayMessage} />
        </div>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold text-[#686868]">Transaction ID</dt><dd className="font-mono text-xs">{row.transactionId}</dd></div>
          <div><dt className="text-xs font-semibold text-[#686868]">Error code</dt><dd>{row.errorCode || '—'}</dd></div>
          <div><dt className="text-xs font-semibold text-[#686868]">Gateway</dt><dd>{row.gatewayProvider || row.gatewayStatus}</dd></div>
          <div><dt className="text-xs font-semibold text-[#686868]">Attempt time</dt><dd>{formatCategoryDateTime(row.dateTime)}</dd></div>
        </dl>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-[#686868]">Human-readable reason</p>
          <p className="rounded-lg bg-slate-50 p-3 text-[#222]">{row.gatewayMessage || row.failureReason}</p>
        </div>
        {raw && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-[#686868]">Raw gateway response</p>
            <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{raw}</pre>
          </div>
        )}
      </div>
    </Modal>
  )
}
