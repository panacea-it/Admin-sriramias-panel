import { useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import FormModalSubmitBar from '../../common/FormModalSubmitBar'
import { getModalEditKey, useInitOnModalOpen } from '../../../hooks/modalFormSync'
import { validateReceiptEdit } from '../../../utils/receiptCompletion'
import { mapApiReceiptStatusToUi } from '../../../utils/receiptManagementHelpers'
import {
  fetchReceiptCoursesList,
  fetchReceiptPaymentModesList,
  fetchReceiptStatusesList,
  fetchBatchesByCourse,
} from '../../../api/receiptManagementAPI'
import { formatINR } from '../../../utils/financeFilters'
import { toast } from '../../../utils/toast'

const FIELD_CLASS =
  'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25'

function emptyForm() {
  return {
    studentName: '',
    courseId: '',
    courseName: '',
    batchId: '',
    batchName: '',
    paymentDate: '',
    paymentMode: 'UPI',
    amountPaid: '',
    transactionId: '',
    remarks: '',
    receiptLifecycleStatus: 'Generated',
    editReason: '',
  }
}

function formFromRow(row) {
  if (!row) return emptyForm()
  const paymentDate = row.paymentDate || row.receiptGeneratedAt
  return {
    studentName: row.studentName || '',
    courseId: row.courseId || '',
    courseName: row.courseName || '',
    batchId: row.batchId || '',
    batchName: row.batchName || '',
    paymentDate: paymentDate ? String(paymentDate).slice(0, 10) : '',
    paymentMode: row.paymentMode || 'UPI',
    amountPaid: String(row.amountPaid ?? row.totalAmount ?? ''),
    transactionId: row.transactionId || row.utrNumber || '',
    remarks: row.remarks || row.verificationNotes || '',
    receiptLifecycleStatus: row.receiptLifecycleStatus || 'Generated',
    editReason: '',
  }
}

export default function EditReceiptDialog({ open, row, onClose, onSave, saving = false }) {
  const [form, setForm] = useState(emptyForm)
  const [courses, setCourses] = useState([])
  const [paymentModes, setPaymentModes] = useState([])
  const [receiptStatuses, setReceiptStatuses] = useState([])
  const [batches, setBatches] = useState([])
  const [dropdownsLoading, setDropdownsLoading] = useState(false)
  const rowRef = useRef(row)
  rowRef.current = row
  const editKey = row ? getModalEditKey(row) : '__closed__'

  useInitOnModalOpen(open, editKey, () => {
    setForm(formFromRow(rowRef.current))
  })

  useEffect(() => {
    if (!open || !row) return
    let cancelled = false
    setDropdownsLoading(true)
    Promise.all([
      fetchReceiptCoursesList(),
      fetchReceiptPaymentModesList(),
      fetchReceiptStatusesList(),
    ])
      .then(([courseList, modeList, statusList]) => {
        if (cancelled) return
        setCourses(courseList)
        setPaymentModes(modeList)
        setReceiptStatuses(statusList)
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load edit form options')
      })
      .finally(() => {
        if (!cancelled) setDropdownsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, row])

  useEffect(() => {
    if (!open || !form.courseId) {
      setBatches([])
      return
    }
    let cancelled = false
    fetchBatchesByCourse(form.courseId)
      .then((items) => {
        if (!cancelled) setBatches(items)
      })
      .catch(() => {
        if (!cancelled) setBatches([])
      })
    return () => {
      cancelled = true
    }
  }, [open, form.courseId])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleCourseChange = (e) => {
    const courseId = e.target.value
    const course = courses.find((c) => c._id === courseId || c.courseId === courseId)
    setForm((f) => ({
      ...f,
      courseId,
      courseName: course?.courseName || course?.label || '',
      batchId: '',
      batchName: '',
    }))
  }

  const handleBatchChange = (e) => {
    const batchId = e.target.value
    const batch = batches.find((b) => b._id === batchId || b.batchId === batchId)
    setForm((f) => ({
      ...f,
      batchId,
      batchName: batch?.batchName || '',
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = validateReceiptEdit(form)
    if (errors.length) {
      errors.forEach((msg) => toast.error(msg))
      return
    }
    onSave?.({
      studentName: form.studentName.trim(),
      courseId: form.courseId,
      courseName: form.courseName.trim(),
      batchId: form.batchId,
      batchName: form.batchName,
      paymentDate: form.paymentDate,
      paymentMode: form.paymentMode,
      amountPaid: Number(form.amountPaid),
      transactionId: form.transactionId.trim(),
      remarks: form.remarks.trim(),
      receiptLifecycleStatus: form.receiptLifecycleStatus,
      editReason: form.editReason.trim(),
    })
  }

  const handleReset = () => {
    setForm(formFromRow(rowRef.current))
  }

  if (!row) return null

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Edit Receipt" showCloseButton={false}>
      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title="Edit Receipt"
          onClose={onClose}
          closeVariant="icon"
          icon={Pencil}
          iconClassName="text-[#246392]"
        />

        <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <div className="rounded-xl border border-[#55ace7]/20 bg-[#eef6fc] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Receipt identity</p>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>
                <span className="text-[#686868]">Receipt #</span>{' '}
                <span className="font-mono font-bold text-[#246392]">{row.receiptNumber}</span>
              </span>
              <span>
                <span className="text-[#686868]">Invoice #</span>{' '}
                <span className="font-mono font-semibold text-[#444]">{row.invoiceNumber || '—'}</span>
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#888]">Receipt and invoice numbers cannot be changed.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold text-[#222]">Student name *</span>
              <input
                type="text"
                value={form.studentName}
                onChange={update('studentName')}
                className={FIELD_CLASS}
                autoComplete="off"
              />
            </label>

            <label className="block text-sm">
              <span className="font-semibold text-[#222]">Course *</span>
              <select
                value={form.courseId}
                onChange={handleCourseChange}
                className={FIELD_CLASS}
                disabled={dropdownsLoading}
              >
                <option value="">Select course</option>
                {courses.map((c) => {
                  const id = c._id || c.courseId
                  return (
                    <option key={id} value={id}>
                      {c.courseName || c.label}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-semibold text-[#222]">Batch</span>
              <select
                value={form.batchId}
                onChange={handleBatchChange}
                className={FIELD_CLASS}
                disabled={!form.courseId}
              >
                <option value="">Select batch</option>
                {batches.map((b) => {
                  const id = b._id || b.batchId
                  return (
                    <option key={id} value={id}>
                      {b.batchName}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-semibold text-[#222]">Payment date *</span>
              <input type="date" value={form.paymentDate} onChange={update('paymentDate')} className={FIELD_CLASS} />
            </label>

            <label className="block text-sm">
              <span className="font-semibold text-[#222]">Payment mode *</span>
              <select
                value={form.paymentMode}
                onChange={update('paymentMode')}
                className={FIELD_CLASS}
                disabled={dropdownsLoading}
              >
                {paymentModes.map((mode) => {
                  const value = mode.value || mode.paymentModeName || mode.label
                  return (
                    <option key={mode.paymentModeId || value} value={value}>
                      {mode.label || mode.paymentModeName}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-semibold text-[#222]">Amount paid *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amountPaid}
                onChange={update('amountPaid')}
                className={FIELD_CLASS}
              />
              {form.amountPaid ? (
                <span className="mt-1 block text-xs text-[#686868]">{formatINR(Number(form.amountPaid) || 0)}</span>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className="font-semibold text-[#222]">Reference / transaction #</span>
              <input
                type="text"
                value={form.transactionId}
                onChange={update('transactionId')}
                className={FIELD_CLASS}
                placeholder="UTR, txn ID, cheque no."
              />
            </label>

            <label className="block text-sm">
              <span className="font-semibold text-[#222]">Receipt status</span>
              <select
                value={form.receiptLifecycleStatus}
                onChange={update('receiptLifecycleStatus')}
                className={FIELD_CLASS}
                disabled={dropdownsLoading}
              >
                {receiptStatuses.map((s) => {
                  const label = s.label || mapApiReceiptStatusToUi(s.value)
                  const value = mapApiReceiptStatusToUi(s.value)
                  return (
                    <option key={s.value} value={value}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold text-[#222]">Remarks / notes</span>
              <textarea
                value={form.remarks}
                onChange={update('remarks')}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25"
                placeholder="Optional internal notes on this receipt"
              />
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold text-[#222]">Edit reason *</span>
              <textarea
                value={form.editReason}
                onChange={update('editReason')}
                rows={2}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25"
                placeholder="Required for audit trail — why are these details being changed?"
              />
            </label>
          </div>
        </div>

        <FormModalSubmitBar
          isEditMode
          updateLabel="Save Changes"
          onReset={handleReset}
          isSubmitting={saving}
          loadingLabel="Saving…"
          className="shrink-0 px-5 pb-5 sm:px-6"
        />
      </form>
    </Modal>
  )
}
