import { DoorOpen } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import CategoryStatusBadge from '../categories/CategoryStatusBadge'
import { formatClassroomDateTime } from '../../utils/classroomApiHelpers'
import { normalizeClassroomStatus } from '../../utils/classroomsStorage'

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

export default function ViewClassroomModal({ open, onClose, classroom, loading = false }) {
  if (!open) return null

  const status = classroom ? normalizeClassroomStatus(classroom.status) : 'Active'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={classroom ? `View ${classroom.name}` : 'View Classroom'}
      showCloseButton={false}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader
          title={loading ? 'Loading…' : classroom?.name || 'Classroom'}
          subtitle={loading ? '—' : classroom?.code || classroom?.id || '—'}
          onClose={onClose}
          icon={DoorOpen}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="space-y-4 p-5 sm:p-6">
          <h3 className="border-b border-[#eef2fc] pb-2 text-sm font-bold uppercase tracking-wide text-[#246392]">
            Classroom Details
          </h3>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-gradient-to-r from-[#eef6fc] via-[#f8fafc] to-[#eef6fc]"
                />
              ))}
            </div>
          ) : classroom ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Classroom ID">{classroom.classroomId || '—'}</DetailItem>
              <DetailItem label="Center">{classroom.centerName || '—'}</DetailItem>
              <DetailItem label="City">{classroom.placeName || '—'}</DetailItem>
              <DetailItem label="Classroom Name">{classroom.name || '—'}</DetailItem>
              <DetailItem label="Classroom Code">{classroom.code || '—'}</DetailItem>
              <DetailItem label="Capacity">
                {classroom.capacity != null ? classroom.capacity : '—'}
              </DetailItem>
              <DetailItem label="Status">
                <CategoryStatusBadge status={status} />
              </DetailItem>
              <DetailItem label="Created Date">
                {formatClassroomDateTime(classroom.createdAt)}
              </DetailItem>
              <DetailItem label="Updated Date">
                {formatClassroomDateTime(classroom.modifiedAt)}
              </DetailItem>
            </dl>
          ) : null}
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
