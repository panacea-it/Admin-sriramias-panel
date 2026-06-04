import { Users, X } from 'lucide-react'
import Modal from '../../../../components/ui/Modal'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

export default function ViewTeacherModal({ open, onClose, item, loading = false }) {
  if (!open) return null

  if (loading) {
    return (
      <Modal open={open} onClose={onClose} size="md" title="View teacher">
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-white p-8 text-sm font-medium text-[#686868]">
          Loading teacher details…
        </div>
      </Modal>
    )
  }

  if (!item) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title={`View ${item.name}`}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#55ace7] via-[#5a7ba8] to-[#1a3a5c] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <Users className="h-6 w-6 text-[#246392]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 text-white">
              <h2 className="truncate text-lg font-bold sm:text-xl">{item.name}</h2>
              <p className="text-sm text-white/85">{item.displayId || item.teacherId || item.id}</p>
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
            Teachers Details
          </h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="ID">{item.displayId || item.teacherId || item.id}</DetailItem>
            <DetailItem label="Teacher Name">{item.name}</DetailItem>
            <DetailItem label="Subject">{item.subject || '—'}</DetailItem>
            <DetailItem label="Center">{item.centerName || '—'}</DetailItem>
            <DetailItem label="Status">
              <CategoryStatusBadge status={item.status} />
            </DetailItem>
            <DetailItem label="Added On">{formatCategoryDateTime(item.createdAt)}</DetailItem>
            <DetailItem label="Modified On">{formatCategoryDateTime(item.modifiedAt)}</DetailItem>
          </dl>
          {item.description ? (
            <div>
              <p className="text-xs font-medium text-[#686868]">Description</p>
              <p className="mt-1 text-sm text-[#222]">{item.description}</p>
            </div>
          ) : null}
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
