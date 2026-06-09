import { Layers } from 'lucide-react'
import Modal from '../../../../components/ui/Modal'
import ModalPanelHeader from '../../../../components/courses/ModalPanelHeader'
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

export default function ViewSubjectModal({ open, onClose, item, loading = false }) {
  if (!open) return null

  if (loading) {
    return (
      <Modal open={open} onClose={onClose} size="md" title="View subject">
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-white p-8 text-sm font-medium text-[#686868]">
          Loading subject details…
        </div>
      </Modal>
    )
  }

  if (!item) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title={`View ${item.name}`} showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader
          title={item.name}
          subtitle={item.displayId || item.subjectId || item.id}
          onClose={onClose}
          icon={Layers}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="space-y-4 p-5 sm:p-6">
          <h3 className="border-b border-[#eef2fc] pb-2 text-sm font-bold uppercase tracking-wide text-[#246392]">
            Subjects Details
          </h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="ID">{item.displayId || item.subjectId || item.id}</DetailItem>
            <DetailItem label="Subject Name">{item.name}</DetailItem>
            <DetailItem label="Status">
              <CategoryStatusBadge status={item.status} />
            </DetailItem>
            <DetailItem label="Created On">
              {formatCategoryDateTime(item.createdAt)}
            </DetailItem>
            <DetailItem label="Modified On">
              {formatCategoryDateTime(item.modifiedAt)}
            </DetailItem>
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
