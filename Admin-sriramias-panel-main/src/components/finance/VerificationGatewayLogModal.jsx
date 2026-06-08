import { CheckCircle2, Globe } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'

export default function VerificationGatewayLogModal({ open, row, onClose }) {
  if (!row?.gatewayResponse) return null
  const gw = row.gatewayResponse

  return (
    <Modal open={open} onClose={onClose} size="md" title="Gateway response log">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader title="Payment gateway response" onClose={onClose} icon={Globe} />
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-2 rounded-lg border border-[#69df66]/40 bg-[#69df66]/10 px-3 py-2 text-sm font-semibold text-[#1a3a5c]">
            <CheckCircle2 className="h-4 w-4 text-[#69df66]" />
            Verified automatically via payment gateway
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase text-[#686868]">Gateway</dt>
              <dd className="font-semibold text-[#222]">{gw.gateway || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#686868]">Status</dt>
              <dd className="font-semibold capitalize text-[#69df66]">{gw.status}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#686868]">Transaction ref</dt>
              <dd className="font-mono text-[#246392]">{gw.transactionRef || row.utrNumber}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#686868]">Amount</dt>
              <dd className="tabular-nums font-semibold">{formatINR(gw.amount ?? row.amount)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#686868]">Method</dt>
              <dd className="capitalize">{gw.method || row.paymentMode}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#686868]">Verified at</dt>
              <dd>{formatCategoryDateTime(row.autoVerifiedAt || gw.capturedAt)}</dd>
            </div>
          </dl>

          {gw.raw && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-[#686868]">Raw response</p>
              <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                {JSON.stringify(gw.raw, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
