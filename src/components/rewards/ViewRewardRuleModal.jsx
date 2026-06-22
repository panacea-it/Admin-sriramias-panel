import { ScrollText } from 'lucide-react'
import Modal from '../ui/Modal'
import { StatusBadge } from '../academics/AcademicsUi'
import { getEventTypeLabel, formatCoins } from '../../utils/rewardApiHelpers'

function InfoRow({ label, children }) {
  return (
    <div className="rounded-xl border border-[#eef2fc] bg-gradient-to-b from-[#fafcff] to-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

function formatLimit(value) {
  if (value == null || value === '') return '—'
  return Number(value).toLocaleString()
}

export default function ViewRewardRuleModal({ open, onClose, rule }) {
  if (!open || !rule) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title={`View rule — ${rule.name}`} showCloseButton={false}>
      <div className="flex max-h-[min(90vh,640px)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        <div className="shrink-0 border-b border-[#eef2fc] bg-gradient-to-r from-[#55ace7] via-[#3d7eb5] to-[#246392] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <ScrollText className="h-6 w-6 text-[#246392]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 text-white">
              <h2 className="truncate text-xl font-bold">{rule.name}</h2>
              <p className="mt-0.5 text-sm text-white/85">{getEventTypeLabel(rule.eventType)}</p>
              <div className="mt-2">
                <StatusBadge status={rule.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Rule Name">{rule.name || '—'}</InfoRow>
            <InfoRow label="Event Type">{getEventTypeLabel(rule.eventType) || '—'}</InfoRow>
            <InfoRow label="Reward Value">{formatCoins(rule.rewardValue)}</InfoRow>
            <InfoRow label="Status">{rule.status || '—'}</InfoRow>
            <InfoRow label="Daily Limit">{formatLimit(rule.dailyLimit)}</InfoRow>
            <InfoRow label="Monthly Limit">{formatLimit(rule.monthlyLimit)}</InfoRow>
            <InfoRow label="Expiry Days">
              {rule.expiryDays != null && rule.expiryDays !== '' ? `${formatLimit(rule.expiryDays)} days` : '—'}
            </InfoRow>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#e5eaf2] bg-[#f8fafc] px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-11 min-w-[120px] rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-8 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:opacity-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
