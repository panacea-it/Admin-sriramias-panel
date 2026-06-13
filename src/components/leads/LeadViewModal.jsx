import { UserRound } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { formatLeadStatusLabel } from '../../data/leadsData'

function DetailItem({ label, children, className }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children || '—'}</div>
    </div>
  )
}

function formatCourseVisited(lead) {
  if (!lead) return '—'
  const parts = [lead.course, lead.courseSub].filter(Boolean)
  return parts.length ? parts.join(' ') : '—'
}

function formatLeadDate(lead) {
  if (!lead?.date) return '—'
  const time = lead.time ? `${lead.time}, ` : ''
  return `${time}${lead.date}`
}

export default function LeadViewModal({ open, onClose, lead }) {
  if (!open || !lead) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title="Lead Details" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader
          title="Lead Details"
          subtitle={lead.userName !== '—' ? lead.userName : 'Lead information'}
          onClose={onClose}
          icon={UserRound}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="space-y-4 p-5 sm:p-6">
          <h3 className="border-b border-[#eef2fc] pb-2 text-sm font-bold uppercase tracking-wide text-[#246392]">
            Lead Information
          </h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="User Name">{lead.userName}</DetailItem>
            <DetailItem label="Email">{lead.email}</DetailItem>
            <DetailItem label="Mobile Number">{lead.mobile}</DetailItem>
            <DetailItem label="Course Visited">{formatCourseVisited(lead)}</DetailItem>
            <DetailItem label="Assigned Counselor">{lead.assignedCounselor}</DetailItem>
            <DetailItem label="Status">{formatLeadStatusLabel(lead.status)}</DetailItem>
            <DetailItem label="Date">{formatLeadDate(lead)}</DetailItem>
            <DetailItem label="Center">{lead.center || '—'}</DetailItem>
          </dl>
        </div>

        <footer className="border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[120px] rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Close
          </button>
        </footer>
      </div>
    </Modal>
  )
}
