import { ClipboardList } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { StatusBadge } from '../../academics/AcademicsUi'
import { formatExamPatternDateTime } from '../../../utils/examPatternApiHelpers'

export default function ExamPatternViewModal({ open, onClose, row, loading = false }) {
  if (!row && !loading) return null

  const description = row?.instructionDescription || '—'

  return (
    <Modal open={open} onClose={onClose} size="lg" title="View Instruction" showCloseButton={false}>
      <div className="flex max-h-[min(88vh,640px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader
          title="View Instruction"
          onClose={onClose}
          closeVariant="icon"
          plainCloseIcon
          icon={ClipboardList}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          {loading ? (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg bg-gradient-to-r from-[#eef6fc] via-[#f8fafc] to-[#eef6fc]"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Instruction ID</dt>
                  <dd className="mt-1 text-sm font-medium text-[#111]">
                    {row?.instructionId || row?.id || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={row?.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Created On</dt>
                  <dd className="mt-1 text-sm font-medium text-[#111]">
                    {formatExamPatternDateTime(row?.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Modified On</dt>
                  <dd className="mt-1 text-sm font-medium text-[#111]">
                    {formatExamPatternDateTime(row?.updatedAt)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Instruction Description
                  </dt>
                  <dd className="mt-2 whitespace-pre-wrap rounded-xl bg-[#f8fafc] px-4 py-3 text-sm leading-relaxed text-[#111]">
                    {description}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
