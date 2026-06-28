import { Globe } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { StatusBadge } from '../../academics/AcademicsUi'

function displayDate(row, key) {
  return row?.[key] || row?.createdAt || '—'
}

export default function LanguageViewModal({ open, onClose, row, loading = false }) {
  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} size="lg" title="View Language" showCloseButton={false}>
      <div className="flex max-h-[min(88vh,560px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader
          title="View Language"
          onClose={onClose}
          closeVariant="icon"
          plainCloseIcon
          icon={Globe}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          {loading || !row ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#6b7280]">Loading language…</div>
          ) : (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Language ID</dt>
                  <dd className="mt-1 text-sm font-medium text-[#111]">{row.languageId || row.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={row.status} />
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Language Name</dt>
                  <dd className="mt-1 text-sm font-medium text-[#1a3a5c]">{row.languageName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Created On</dt>
                  <dd className="mt-1 text-sm font-medium text-[#111]">{displayDate(row, 'createdOn')}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Modified On</dt>
                  <dd className="mt-1 text-sm font-medium text-[#111]">{displayDate(row, 'modifiedOn')}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
