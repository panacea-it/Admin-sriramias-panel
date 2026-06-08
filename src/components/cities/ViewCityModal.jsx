import { MapPin, X } from 'lucide-react'
import Modal from '../ui/Modal'
import CategoryStatusBadge from '../categories/CategoryStatusBadge'
import { formatCityDateTime } from '../../utils/cityApiHelpers'

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

export default function ViewCityModal({ open, onClose, city, loading = false }) {
  if (!open) return null

  const status = city?.status === 'Inactive' ? 'In Active' : city?.status

  return (
    <Modal open={open} onClose={onClose} size="md" title={city?.placeName ? `View ${city.placeName}` : 'View City'}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#55ace7] via-[#5a7ba8] to-[#1a3a5c] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <MapPin className="h-6 w-6 text-[#246392]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 text-white">
              <h2 className="truncate text-lg font-bold sm:text-xl">{city?.placeName || 'City'}</h2>
              <p className="text-sm text-white/85">{city?.code || city?.id || '—'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 p-5 sm:p-6">
          <h3 className="border-b border-[#eef2fc] pb-2 text-sm font-bold uppercase tracking-wide text-[#246392]">
            City Details
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-[#eef6fc]" />
              ))}
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="City Code">{city?.code || '—'}</DetailItem>
              <DetailItem label="Place Name">{city?.placeName || '—'}</DetailItem>
              <DetailItem label="Center Name">{city?.centerName || '—'}</DetailItem>
              <DetailItem label="Status">
                <CategoryStatusBadge status={status} />
              </DetailItem>
              <DetailItem label="Added On">{formatCityDateTime(city?.createdAt)}</DetailItem>
              <DetailItem label="Modified On">{formatCityDateTime(city?.modifiedAt)}</DetailItem>
            </dl>
          )}
        </div>

        <footer className="border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[120px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
          >
            Close
          </button>
        </footer>
      </div>
    </Modal>
  )
}
