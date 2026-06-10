import { TicketPercent } from 'lucide-react'
import Modal from '../ui/Modal'
import { StatusBadge } from '../academics/AcademicsUi'
import { cn } from '../../utils/cn'

function InfoRow({ label, children }) {
  return (
    <div className="rounded-xl border border-[#eef2fc] bg-gradient-to-b from-[#fafcff] to-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

export default function ViewCouponModal({ open, onClose, coupon }) {
  if (!open || !coupon) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title={`View coupon — ${coupon.name}`}>
      <div className="flex max-h-[min(90vh,640px)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        <div className="shrink-0 border-b border-[#eef2fc] bg-gradient-to-r from-[#55ace7] via-[#3d7eb5] to-[#246392] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <TicketPercent className="h-6 w-6 text-[#246392]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 text-white">
              <h2 className="truncate text-xl font-bold">{coupon.name}</h2>
              <p className="mt-0.5 font-mono text-sm text-[#cbeeff]">{coupon.couponCode}</p>
              <div className="mt-2">
                <StatusBadge status={coupon.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Type">{coupon.type}</InfoRow>
            <InfoRow label="Value">{coupon.value || '—'}</InfoRow>
            <InfoRow label="Redemptions">{coupon.redemptions?.toLocaleString?.() ?? coupon.redemptions}</InfoRow>
            <InfoRow label="Expires On">{coupon.expiresOn}</InfoRow>
            <InfoRow label="Valid From">{coupon.validFrom || '—'}</InfoRow>
            <InfoRow label="Valid Till">{coupon.validTill || '—'}</InfoRow>
            <InfoRow label="Category">{coupon.category || '—'}</InfoRow>
            <InfoRow label="Customer Eligibility">
              {coupon.eligibility === 'specific'
                ? `Specific: ${coupon.specificStudent || '—'}`
                : 'Everyone'}
            </InfoRow>
            <InfoRow label="Total Users Limit">{coupon.totalUsersLimit || '—'}</InfoRow>
            <InfoRow label="Usage Limit per Customer">{coupon.usageLimitPerCustomer || '—'}</InfoRow>
            <InfoRow label="Min Quantity of Items">{coupon.minQuantityItems || '—'}</InfoRow>
            <InfoRow label="Minimum Cart Value">{coupon.minCartValue || '—'}</InfoRow>
          </div>
          {coupon.topPerforming ? (
            <p className={cn('mt-4 text-sm font-semibold text-[#166534]')}>★ Top performing coupon</p>
          ) : null}
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
