import { MapPin } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
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

  const displayAddress = city?.cityAddress || city?.placeName
  const status = city?.status === 'In Active' ? 'In Active' : city?.status

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={displayAddress ? `View ${displayAddress}` : 'View City'}
      showCloseButton={false}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader
          title={displayAddress || 'City'}
          subtitle={city?.centerName || 'City details'}
          onClose={onClose}
          icon={MapPin}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

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
              <DetailItem label="Center Name">{city?.centerName || '—'}</DetailItem>
              <DetailItem label="City Address">{displayAddress || '—'}</DetailItem>
              <DetailItem label="Status">
                <CategoryStatusBadge status={status} />
              </DetailItem>
              <DetailItem label="Created">{formatCityDateTime(city?.createdAt)}</DetailItem>
              <DetailItem label="Updated">{formatCityDateTime(city?.updatedAt || city?.modifiedAt)}</DetailItem>
            </dl>
          )}
        </div>

        <footer className="border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[120px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50 focus-visible:ring-offset-2"
          >
            Close
          </button>
        </footer>
      </div>
    </Modal>
  )
}
