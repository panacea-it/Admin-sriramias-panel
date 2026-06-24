import { Layers } from 'lucide-react'
import Modal from '../ui/Modal'
import { StatusBadge } from '../academics/AcademicsUi'
import CurrentAffairsModalHeader from './CurrentAffairsModalHeader'

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

export default function ViewCurrentAffairsModal({ open, onClose, item }) {
  if (!open || !item) return null

  const raw = item._raw || {}

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={`View ${item.name}`}
      showCloseButton={false}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <CurrentAffairsModalHeader
          title={item.name}
          subtitle={item.category}
          onClose={onClose}
          icon={Layers}
        />

        <div className="space-y-4 p-5 sm:p-6">
          <h3 className="border-b border-[#eef2fc] pb-2 text-sm font-bold uppercase tracking-wide text-[#246392]">
            Current Affairs Details
          </h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Name">{item.name}</DetailItem>
            <DetailItem label="Category">{item.category || '—'}</DetailItem>
            <DetailItem label="Status">
              <StatusBadge status={item.status} />
            </DetailItem>
            {raw.year ? <DetailItem label="Year">{raw.year}</DetailItem> : null}
            {raw.month ? <DetailItem label="Month">{raw.month}</DetailItem> : null}
            {raw.paperName ? <DetailItem label="Paper Name">{raw.paperName}</DetailItem> : null}
            {raw.mainsCategory ? (
              <DetailItem label="Mains Category">{raw.mainsCategory}</DetailItem>
            ) : null}
            {item.createdBy?.name ? (
              <DetailItem label="Created By">{item.createdBy.name}</DetailItem>
            ) : null}
            {raw.pdfUrl ? (
              <DetailItem label="PDF">
                <a
                  href={raw.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#246392] underline"
                >
                  View PDF
                </a>
              </DetailItem>
            ) : null}
            {raw.uploadMagzineUrl ? (
              <DetailItem label="Magazine">
                <a
                  href={raw.uploadMagzineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#246392] underline"
                >
                  Download Magazine
                </a>
              </DetailItem>
            ) : null}
          </dl>
        </div>

        <footer className="border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#1a3a5c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#152f4a]"
          >
            Close
          </button>
        </footer>
      </div>
    </Modal>
  )
}
