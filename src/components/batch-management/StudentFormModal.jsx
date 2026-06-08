import { useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { PAYMENT_STATUSES } from '../../data/batchManagementData'
import BatchFormModalShell from './BatchFormModalShell'
import {
  BatchField,
  BatchModalFooter,
  batchInputClass,
  batchInputReadonlyClass,
  batchSelectClass,
} from './batchModalUi'

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  course: '',
  batch: '',
  paymentStatus: 'Pending',
  attendance: '',
  progress: '',
}

export default function StudentFormModal({
  open,
  onClose,
  mode = 'add',
  initialValues,
  seedKey,
  onSubmit,
  saving = false,
}) {
  const [form, setForm] = useState(EMPTY)
  const initialRef = useRef(initialValues)
  initialRef.current = initialValues
  const editKey = seedKey ?? `${mode}:${getModalEditKey(initialValues)}`

  useInitOnModalOpen(open, editKey, () => {
    setForm({ ...EMPTY, ...initialRef.current })
  })

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  const isEdit = mode === 'edit'
  const title = isEdit ? 'Edit Student' : 'Add Student'
  const subtitle = isEdit
    ? 'Update student enrollment details'
    : 'Enroll a new student in this batch'

  return (
    <BatchFormModalShell
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="lg"
      saving={saving}
      footer={
        <BatchModalFooter
          onCancel={onClose}
          submitLabel={saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Student'}
          saving={saving}
          submitForm="batch-student-form"
          submitType="submit"
        />
      }
    >
      <form id="batch-student-form" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <BatchField label="Full Name" required className="sm:col-span-2">
            <input
              required
              value={form.name}
              onChange={handleChange('name')}
              className={batchInputClass}
              placeholder="Student full name"
            />
          </BatchField>
          <BatchField label="Email" required>
            <input
              required
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className={batchInputClass}
              placeholder="email@example.com"
            />
          </BatchField>
          <BatchField label="Phone Number" required>
            <input
              required
              value={form.phone}
              onChange={handleChange('phone')}
              className={batchInputClass}
              placeholder="+91 98765 43210"
            />
          </BatchField>
          <BatchField label="Course">
            <input readOnly value={form.course} className={batchInputReadonlyClass} />
          </BatchField>
          <BatchField label="Batch">
            <input readOnly value={form.batch} className={batchInputReadonlyClass} />
          </BatchField>
          <BatchField label="Payment Status">
            <select
              value={form.paymentStatus}
              onChange={handleChange('paymentStatus')}
              className={batchSelectClass}
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </BatchField>
          <BatchField label="Attendance (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={form.attendance}
              onChange={handleChange('attendance')}
              className={batchInputClass}
              placeholder="0–100"
            />
          </BatchField>
          <BatchField label="Course Progress (%)" className="sm:col-span-2">
            <input
              type="number"
              min={0}
              max={100}
              value={form.progress}
              onChange={handleChange('progress')}
              className={batchInputClass}
              placeholder="0–100"
            />
          </BatchField>
        </div>
      </form>
    </BatchFormModalShell>
  )
}
