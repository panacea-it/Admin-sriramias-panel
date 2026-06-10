<<<<<<< HEAD
import { useRef, useState } from 'react'
import { AlarmClock, TicketPercent } from 'lucide-react'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { couponToForm } from '../../utils/couponsStorage'
=======
import { useState } from 'react'
import { AlarmClock, TicketPercent } from 'lucide-react'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import {
  CourseDateInput,
  CourseFileInput,
  CourseFormField,
  CourseInput,
  CourseSelect,
} from '../courses/CourseFormField'

const COUPON_STUDENTS = ['Darshan', 'Priya Sharma', 'Amit Kumar', 'Neha Gupta', 'Rajesh Verma']

const emptyForm = {
  couponName: '',
  couponCode: '',
  type: 'Percentage',
  value: '',
  validFrom: '',
  validTill: '',
  category: 'Course',
  backgroundImage: '',
  totalUsersLimit: '',
  usageLimitPerCustomer: '',
  minQuantityItems: '',
  minCartValue: '',
  eligibility: 'everyone',
  specificStudent: COUPON_STUDENTS[0],
}

function ValueField({ type, value, onChange }) {
  const label = type === 'Percentage' ? 'Percentage Value' : type === 'Flat Discount' ? 'Flat Amount' : 'Value'
  return (
    <CourseFormField label={label} required>
      <div className="relative">
        <CourseInput
          value={value}
          onChange={onChange}
          inputMode="decimal"
          className="pr-11"
          placeholder=""
        />
        <AlarmClock
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#246392]"
          strokeWidth={2}
        />
      </div>
    </CourseFormField>
  )
}

function EligibilityOption({ id, name, label, checked, onChange, children }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-[#e8f4fc] px-4 py-3.5 transition',
        checked && 'ring-2 ring-[#55ace7]/35',
      )}
    >
      <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
        <input
          id={id}
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 shrink-0 border-[#246392] text-[#246392] focus:ring-[#55ace7]"
        />
        <span className="text-sm font-semibold text-[#333]">{label}</span>
      </label>
      {children}
    </div>
  )
}

<<<<<<< HEAD
export default function AddCouponModal({ open, onClose, onSubmit, editingCoupon = null }) {
  const [form, setForm] = useState(emptyForm)
  const editingRef = useRef(editingCoupon)
  editingRef.current = editingCoupon
  const editKey = getModalEditKey(editingCoupon)
  const isEdit = Boolean(editingCoupon)

  useInitOnModalOpen(open, editKey, () => {
    const row = editingRef.current
    if (row) {
      setForm(couponToForm(row) || { ...emptyForm })
    } else {
      setForm({ ...emptyForm })
    }
  })
=======
export default function AddCouponModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleClose = () => {
    setForm({ ...emptyForm })
    onClose()
  }

  const handleReset = () => {
    setForm({ ...emptyForm })
    toast.message('Form reset')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.couponName.trim() || !form.couponCode.trim()) {
      toast.error('Coupon name and code are required')
      return
    }
    if (!form.value.trim() || !form.validFrom || !form.validTill) {
      toast.error('Please fill value and validity dates')
      return
    }
<<<<<<< HEAD
    if (!form.backgroundImage?.trim() && !(isEdit && editingRef.current?.backgroundImage)) {
=======
    if (!form.backgroundImage) {
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
      toast.error('Background image is required')
      return
    }
    if (form.eligibility === 'specific' && !form.specificStudent) {
      toast.error('Select a student for specific eligibility')
      return
    }
<<<<<<< HEAD
    onSubmit?.(form, editingRef.current)
    toast.success(isEdit ? 'Coupon updated successfully' : 'Coupon created successfully')
    handleClose()
  }

  const modalTitle = isEdit ? 'Edit Coupon' : 'Add Coupon'

  return (
    <Modal open={open} onClose={handleClose} size="full" title={modalTitle}>
=======
    onSubmit?.(form)
    toast.success('Coupon created successfully')
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} size="full" title="Add Coupon">
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
<<<<<<< HEAD
        <ModalPanelHeader title={isEdit ? 'Edit Coupon' : 'Coupon'} icon={TicketPercent} />
=======
        <ModalPanelHeader title="Coupon" onBack={handleClose} icon={TicketPercent} />
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa

        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
          <SectionBar title="Coupon Details" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CourseFormField label="Coupon Name" required>
              <CourseInput value={form.couponName} onChange={update('couponName')} />
            </CourseFormField>
            <CourseFormField label="Coupon Code" required>
              <CourseInput value={form.couponCode} onChange={update('couponCode')} />
            </CourseFormField>
            <CourseFormField label="Type" required>
              <CourseSelect value={form.type} onChange={update('type')}>
                <option value="Percentage">Percentage</option>
                <option value="Flat Discount">Flat Discount</option>
                <option value="BOGO">BOGO</option>
              </CourseSelect>
            </CourseFormField>

            <ValueField type={form.type} value={form.value} onChange={update('value')} />

            <CourseFormField label="Valid From" required>
              <CourseDateInput value={form.validFrom} onChange={update('validFrom')} />
            </CourseFormField>
            <CourseFormField label="Valid Till" required>
              <CourseDateInput value={form.validTill} onChange={update('validTill')} />
            </CourseFormField>

            <CourseFormField label="Category">
              <CourseSelect value={form.category} onChange={update('category')}>
                <option value="Course">Course</option>
                <option value="Books">Books</option>
                <option value="Test Series">Test Series</option>
                <option value="All">All</option>
              </CourseSelect>
            </CourseFormField>
            <CourseFormField label="Background Image" required className="sm:col-span-2">
              <CourseFileInput
                placeholder={form.backgroundImage || '312×214 Kb'}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    backgroundImage: e.target.files?.[0]?.name || '',
                  }))
                }
              />
            </CourseFormField>
          </div>

          <SectionBar title="Usage Limit" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CourseFormField label="Total Users Limit">
              <CourseInput
                value={form.totalUsersLimit}
                onChange={update('totalUsersLimit')}
                inputMode="numeric"
              />
            </CourseFormField>
            <CourseFormField label="Usage Limit per Customer">
              <CourseInput
                value={form.usageLimitPerCustomer}
                onChange={update('usageLimitPerCustomer')}
                inputMode="numeric"
              />
            </CourseFormField>
            <CourseFormField label="Minimum Quantity of Items">
              <CourseInput
                value={form.minQuantityItems}
                onChange={update('minQuantityItems')}
                inputMode="numeric"
              />
            </CourseFormField>
            <CourseFormField label="Minimum Cart Value" className="lg:col-span-1">
              <CourseInput
                value={form.minCartValue}
                onChange={update('minCartValue')}
                inputMode="decimal"
              />
            </CourseFormField>
          </div>

          <div>
            <h3 className="mb-3 text-base font-bold text-[#246392] sm:text-lg">Customer Eligibility</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <EligibilityOption
                id="eligibility-everyone"
                name="eligibility"
                label="Every one"
                checked={form.eligibility === 'everyone'}
                onChange={() => setForm((f) => ({ ...f, eligibility: 'everyone' }))}
              />
              <EligibilityOption
                id="eligibility-specific"
                name="eligibility"
                label="Specific Students"
                checked={form.eligibility === 'specific'}
                onChange={() => setForm((f) => ({ ...f, eligibility: 'specific' }))}
              >
                {form.eligibility === 'specific' && (
                  <div className="mt-3">
                    <CourseSelect
                      value={form.specificStudent}
                      onChange={update('specificStudent')}
                    >
                      {COUPON_STUDENTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </CourseSelect>
                  </div>
                )}
              </EligibilityOption>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 border-t border-slate-200/80 pt-8">
            <button
              type="button"
              onClick={handleReset}
              className="min-w-[140px] rounded-full bg-gradient-to-r from-[#5eb8f5] to-[#2b78a5] px-10 py-3 text-base font-bold text-white shadow-[0_6px_18px_rgba(43,120,165,0.35)] transition hover:brightness-105"
            >
              Reset
            </button>
            <button
              type="submit"
              className="min-w-[140px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-10 py-3 text-base font-bold text-white shadow-[0_6px_18px_rgba(5,25,45,0.4)] transition hover:brightness-110"
            >
<<<<<<< HEAD
              {isEdit ? 'Update Coupon' : 'Save'}
=======
              Save
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

