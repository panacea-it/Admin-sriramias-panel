import { useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { Wallet } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import { PAYMENT_STATUS_REASONS } from '../../constants/financePermissions'

const STATUS_OPTIONS = ['Paid', 'Partial', 'Pending', 'Failed', 'Refunded']
const MODE_OPTIONS = ['UPI', 'Card', 'Bank Transfer', 'Cash', 'Net Banking']

const emptyForm = () => ({
  newStatus: 'Paid',
  reason: PAYMENT_STATUS_REASONS[0],
  comment: '',
  amount: '',
  paymentDate: '',
  paymentMode: 'UPI',
  transactionId: '',
})

export default function EditPaymentModal({ open, onClose, payment, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const paymentRef = useRef(payment)
  paymentRef.current = payment
  const editKey = payment ? getModalEditKey(payment) : '__closed__'

  useInitOnModalOpen(open, editKey, () => {
    const p = paymentRef.current
    if (!p) return
    setForm({
      newStatus: p.paymentStatus || 'Paid',
      reason: PAYMENT_STATUS_REASONS[0],
      comment: '',
      amount: String(p.amountPaid ?? ''),
      paymentDate: p.paymentDate ? p.paymentDate.slice(0, 10) : '',
      paymentMode: p.paymentMode || 'UPI',
      transactionId: p.transactionId || '',
    })
  })

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.comment.trim()) return
    onSubmit?.({
      newStatus: form.newStatus,
      reason: form.reason,
      comment: form.comment.trim(),
      amountAdjustment: form.amount ? Number(form.amount) : undefined,
      paymentDate: form.paymentDate || undefined,
      paymentMode: form.paymentMode,
      transactionId: form.transactionId.trim() || undefined,
    })
  }

  const handleReset = () => {
    if (payment) {
      setForm({
        newStatus: payment.paymentStatus || 'Paid',
        reason: PAYMENT_STATUS_REASONS[0],
        comment: '',
        amount: String(payment.amountPaid ?? ''),
        paymentDate: payment.paymentDate ? payment.paymentDate.slice(0, 10) : '',
        paymentMode: payment.paymentMode || 'UPI',
        transactionId: payment.transactionId || '',
      })
    } else {
      setForm(emptyForm())
    }
  }

  if (!payment) return null

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Edit Payment Status">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader title="Edit Payment Status" onBack={onClose} icon={Wallet} iconClassName="text-[#246392]" />

        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm text-[#686868]">
            Updating <span className="font-semibold text-[#222]">{payment.studentName}</span> — {payment.id}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#222]">New Status</span>
              <select
                value={form.newStatus}
                onChange={update('newStatus')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#222]">Reason</span>
              <select
                value={form.reason}
                onChange={update('reason')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
              >
                {PAYMENT_STATUS_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-semibold text-[#222]">Comment *</span>
              <textarea
                value={form.comment}
                onChange={update('comment')}
                required
                rows={3}
                placeholder="Explain the status change…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#222]">Amount (₹)</span>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={update('amount')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#222]">Payment Date</span>
              <input
                type="date"
                value={form.paymentDate}
                onChange={update('paymentDate')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#222]">Payment Mode</span>
              <select
                value={form.paymentMode}
                onChange={update('paymentMode')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
              >
                {MODE_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#222]">Transaction ID</span>
              <input
                type="text"
                value={form.transactionId}
                onChange={update('transactionId')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
              />
            </label>
          </div>

          <FormModalSubmitBar isEditMode updateLabel="Save Changes" onReset={handleReset} />
        </div>
      </form>
    </Modal>
  )
}
