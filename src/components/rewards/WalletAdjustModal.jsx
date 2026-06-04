import { useEffect, useState } from 'react'
import { validateWalletAdjustForm } from '../../utils/rewardValidation'
import RewardsModalShell, {
  RewardsModalCancelButton,
  RewardsModalField,
  RewardsModalPrimaryButton,
} from './RewardsModalShell'
import { REWARDS_MODAL_FIELD_GAP, rewardsModalInputClass, rewardsModalTextareaClass } from './rewardsModalUi'

export default function WalletAdjustModal({
  open,
  onClose,
  mode = 'credit',
  students = [],
  onSubmit,
  loading,
}) {
  const [form, setForm] = useState({ studentId: '', amount: '', reason: '' })
  const [errors, setErrors] = useState({})
  const isCredit = mode === 'credit'

  useEffect(() => {
    if (!open) {
      setForm({ studentId: '', amount: '', reason: '' })
      setErrors({})
    }
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    const { valid, errors: nextErrors } = validateWalletAdjustForm(form)
    setErrors(nextErrors)
    if (!valid) return
    onSubmit({ ...form, amount: Number(form.amount), type: mode })
  }

  const title = isCredit ? 'Manual Credit' : 'Manual Debit'
  const submitLabel = isCredit ? 'Credit Coins' : 'Debit Coins'

  return (
    <RewardsModalShell
      open={open}
      onClose={onClose}
      title={title}
      description={isCredit ? 'Add coins to a student wallet with an audit reason.' : 'Remove coins from a student wallet with confirmation.'}
      footer={
        <>
          <RewardsModalCancelButton onClick={onClose} disabled={loading} />
          <RewardsModalPrimaryButton type="submit" form="wallet-adjust-form" loading={loading}>
            {submitLabel}
          </RewardsModalPrimaryButton>
        </>
      }
    >
      <form id="wallet-adjust-form" onSubmit={handleSubmit} className={REWARDS_MODAL_FIELD_GAP}>
        <RewardsModalField label="Student" error={errors.studentId}>
          <select
            value={form.studentId}
            onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
            className={rewardsModalInputClass(errors.studentId)}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.studentName} ({s.studentId})
              </option>
            ))}
          </select>
        </RewardsModalField>
        <RewardsModalField label="Coin Amount (1S)" error={errors.amount}>
          <input
            type="number"
            min="1"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Enter amount"
            className={rewardsModalInputClass(errors.amount)}
          />
        </RewardsModalField>
        <RewardsModalField label="Reason" error={errors.reason}>
          <textarea
            rows={3}
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="Describe why this adjustment is being made"
            className={rewardsModalTextareaClass(errors.reason)}
          />
        </RewardsModalField>
      </form>
    </RewardsModalShell>
  )
}
