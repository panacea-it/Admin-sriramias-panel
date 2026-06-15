import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import EnquiryCounselorSelect from './EnquiryCounselorSelect'
import EnquiryLeadStatusSelect from './EnquiryLeadStatusSelect'
import { cn } from '../../utils/cn'
import { ENQUIRY_CENTERS } from '../../data/enquiriesData'

const ENQUIRY_TYPE_OPTIONS = ['Admission Enquiry', 'Demo']

const fieldClass = cn(
  'h-11 w-full rounded-xl border border-slate-200/80 bg-[#eef2fc]/60 px-4 text-sm text-[#222] outline-none transition',
  'focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-[#55ace7]/25',
)

const selectClass = cn(fieldClass, 'cursor-pointer appearance-none pr-10')

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
    if (!form.student.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Please fill all required fields')
      return
    }
    onSave?.(form)
    onClose?.()
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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Student Name">
              <input
                type="text"
                value={form.student}
                onChange={(e) => update('student', e.target.value)}
                className={fieldClass}
                placeholder="Enter student name"
                required
              />
            </FormField>
            <FormField label="Enquiry Type">
              <select
                value={form.enquiryType}
                onChange={(e) => update('enquiryType', e.target.value)}
                className={selectClass}
              >
                {ENQUIRY_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={fieldClass}
                placeholder="Enter email address"
                required
              />
            </FormField>
            <FormField label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className={fieldClass}
                placeholder="Enter phone number"
                required
              />
            </FormField>
            <FormField label="Center">
              <select
                value={form.center}
                onChange={(e) => update('center', e.target.value)}
                className={selectClass}
              >
                {ENQUIRY_CENTERS.map((center) => (
                  <option key={center} value={center}>
                    {center}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Assigned Counselor">
              <EnquiryCounselorSelect
                value={form.assignedCounselor}
                onChange={(value) => update('assignedCounselor', value)}
                options={counselorOptions}
                size="default"
                usePortal={false}
              />
            </FormField>
            <FormField label="Lead Status" className="sm:col-span-2">
              <EnquiryLeadStatusSelect
                value={form.leadStatus}
                onChange={(value) => update('leadStatus', value)}
                options={leadStatusOptions}
                size="default"
                usePortal={false}
              />
            </FormField>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Save
          </button>
        </footer>
      </form>
    </Modal>
  )
}
