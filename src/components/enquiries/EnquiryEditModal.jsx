import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import EnquiryCounselorSelect from './EnquiryCounselorSelect'
import EnquiryLeadStatusSelect from './EnquiryLeadStatusSelect'
import { cn } from '../../utils/cn'

const fieldClass = cn(
  'h-11 w-full rounded-xl border border-slate-200/80 bg-[#eef2fc]/60 px-4 text-sm text-[#222] outline-none transition',
  'focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-[#55ace7]/25',
)

const readOnlyClass = cn(
  fieldClass,
  'cursor-not-allowed bg-slate-100/80 text-[#686868]',
)

function FormField({ label, children, className }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="text-xs font-semibold text-[#686868]">{label}</span>
      {children}
    </label>
  )
}

function buildFormFromEnquiry(enquiry, counselor, leadStatus) {
  return {
    student: enquiry?.student ?? '',
    email: enquiry?.email ?? '',
    phone: enquiry?.phone ?? '',
    center: enquiry?.center ?? '',
    enquiryType: enquiry?.enquiryType ?? '',
    courseName: enquiry?.courseName ?? '',
    assignedCounselor: counselor ?? '',
    leadStatus: leadStatus ?? '',
  }
}

export default function EnquiryEditModal({
  open,
  onClose,
  enquiry,
  assignedCounselor,
  leadStatus,
  counselorOptions,
  leadStatusOptions,
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState(() =>
    buildFormFromEnquiry(enquiry, assignedCounselor, leadStatus),
  )

  useEffect(() => {
    if (open && enquiry) {
      setForm(buildFormFromEnquiry(enquiry, assignedCounselor, leadStatus))
    }
  }, [open, enquiry, assignedCounselor, leadStatus])

  if (!open || !enquiry) return null

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.leadStatus) {
      toast.error('Please select a lead status')
      return
    }
    onSave?.(form)
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Edit Enquiry" showCloseButton={false}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col overflow-visible rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title="Edit Enquiry"
          subtitle={enquiry.student || 'Update enquiry details'}
          onClose={onClose}
          icon={Pencil}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="p-5 sm:p-6">
          <p className="mb-4 text-xs text-[#686868]">
            Student details are read-only. You can update the assigned counselor and lead status.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Student Name">
              <input
                type="text"
                value={form.student}
                readOnly
                className={readOnlyClass}
              />
            </FormField>
            <FormField label="Enquiry Type">
              <input
                type="text"
                value={form.enquiryType}
                readOnly
                className={readOnlyClass}
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                readOnly
                className={readOnlyClass}
              />
            </FormField>
            <FormField label="Phone">
              <input
                type="tel"
                value={form.phone}
                readOnly
                className={readOnlyClass}
              />
            </FormField>
            <FormField label="Center">
              <input
                type="text"
                value={form.center}
                readOnly
                className={readOnlyClass}
              />
            </FormField>
            <FormField label="Course">
              <input
                type="text"
                value={form.courseName}
                readOnly
                className={readOnlyClass}
              />
            </FormField>
            <FormField label="Assigned Counselor">
              <EnquiryCounselorSelect
                value={form.assignedCounselor}
                onChange={(value) => update('assignedCounselor', value)}
                options={counselorOptions}
                size="default"
                usePortal={false}
                disabled={saving}
              />
            </FormField>
            <FormField label="Lead Status" className="sm:col-span-2">
              <EnquiryLeadStatusSelect
                value={form.leadStatus}
                onChange={(value) => update('leadStatus', value)}
                options={leadStatusOptions}
                size="default"
                usePortal={false}
                disabled={saving}
              />
            </FormField>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </footer>
      </form>
    </Modal>
  )
}
