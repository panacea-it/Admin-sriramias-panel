import { Shield, Ban, Unlock } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import PaymentAttemptFraudBadge from './PaymentAttemptFraudBadge'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function PaymentAttemptFraudModal({ open, row, onClose, onBlock, onUnblock, canBlock, saving }) {
  if (!row) return null
  const device = row.device || {}

  return (
    <Modal open={open} onClose={onClose} size="md" title="Device & IP details">
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title="Fraud monitoring"
          subtitle={`${row.student} · Risk ${row.ipRiskScore ?? '—'}`}
          onClose={onClose}
          icon={Shield}
        />
        <div className="space-y-4 p-5 text-sm">
          <div className="flex items-center gap-2">
            <PaymentAttemptFraudBadge status={row.fraudStatus} riskScore={row.ipRiskScore} />
            {row.isBlocked && <span className="text-xs font-semibold text-red-700">Payment attempts restricted</span>}
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs font-semibold text-[#686868]">Device ID</dt><dd className="font-mono text-xs">{device.deviceId || '—'}</dd></div>
            <div><dt className="text-xs font-semibold text-[#686868]">IP Address</dt><dd className="font-mono text-xs">{device.ipAddress || '—'}</dd></div>
            <div><dt className="text-xs font-semibold text-[#686868]">Browser</dt><dd>{device.browser || '—'}</dd></div>
            <div><dt className="text-xs font-semibold text-[#686868]">OS</dt><dd>{device.os || '—'}</dd></div>
            <div><dt className="text-xs font-semibold text-[#686868]">Geolocation</dt><dd>{device.geolocation || '—'}</dd></div>
            <div><dt className="text-xs font-semibold text-[#686868]">Last attempt</dt><dd>{formatCategoryDateTime(row.dateTime)}</dd></div>
          </dl>
          {row.fraudAudit?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-[#686868]">Block audit trail</p>
              <ul className="space-y-1 text-xs">
                {row.fraudAudit.map((a) => (
                  <li key={a.id} className="rounded bg-slate-50 px-2 py-1">
                    {a.action} by {a.by} · {formatCategoryDateTime(a.at)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {canBlock && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {!row.isBlocked ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onBlock?.(row)}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <Ban className="h-4 w-4" /> Block device/IP
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onUnblock?.(row)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a3a5c] disabled:opacity-50"
                >
                  <Unlock className="h-4 w-4" /> Unblock
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
