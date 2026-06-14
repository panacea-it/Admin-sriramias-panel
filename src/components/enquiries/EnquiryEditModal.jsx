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

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200/90 bg-white px-4 text-sm text-[#333] shadow-sm outline-none transition placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25'

const selectClass =
  'h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-200/90 bg-white px-4 pr-10 text-sm font-medium text-[#333] shadow-sm outline-none transition focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25'

function FormField({ label, children, className }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="text-sm font-semibold text-[#333]">{label}</span>
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

  if (!enquiry) return null

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.student.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Please fill all required fields')
      return
    }
    onSave?.(form)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Edit Enquiry" showCloseButton={false}>
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
      >
        <ModalPanelHeader
          title="Edit Enquiry"
          onClose={onClose}
          icon={Pencil}
          iconClassName="text-[#246392]"
          closeVariant="icon"
        />

        <div className="max-h-[min(70vh,620px)] overflow-y-auto px-5 py-6 sm:px-8 sm:py-7">
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5">
            <FormField label="Student Name">
              <input
                type="text"
                value={form.student}
                onChange={(e) => update('student', e.target.value)}
                className={inputClass}
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
                className={inputClass}
                required
              />
            </FormField>
            <FormField label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className={inputClass}
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
              />
            </FormField>
            <FormField label="Lead Status" className="sm:col-span-2">
              <EnquiryLeadStatusSelect
                value={form.leadStatus}
                onChange={(value) => update('leadStatus', value)}
                options={leadStatusOptions}
                size="default"
                className="sm:max-w-sm"
              />
            </FormField>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[100px] rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-w-[100px] rounded-lg bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(5,25,45,0.35)] transition hover:brightness-110"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
