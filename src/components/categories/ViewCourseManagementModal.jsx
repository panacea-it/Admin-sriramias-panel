import { BookOpen } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import CategoryStatusBadge from './CategoryStatusBadge'
import { formatCategoryDateTime } from '../../utils/formatDateTime'

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

export default function ViewCourseManagementModal({ open, onClose, item }) {
  if (!open || !item) return null

  return (
    <Modal open={open} onClose={onClose} size="lg" title={`View ${item.name}`} showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader
          title={item.name}
          subtitle={item.courseId}
          onClose={onClose}
          icon={BookOpen}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="bg-[#f0f4f8] p-5 sm:p-6">
          <div className="rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:p-6">
            <h3 className="mb-4 border-b border-[#eef2fc] pb-2 text-sm font-bold uppercase tracking-wide text-[#246392]">
              Course Details
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Course ID">{item.courseId || '—'}</DetailItem>
              <DetailItem label="Course Name">{item.name}</DetailItem>
              <DetailItem label="Centre">{item.centerName || '—'}</DetailItem>
              <DetailItem label="Program">{item.program || '—'}</DetailItem>
              <DetailItem label="Exam Category">{item.examCategory || '—'}</DetailItem>
              <DetailItem label="Exam Subcategory">{item.examSubCategory || '—'}</DetailItem>
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
          </div>
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
