import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { validateWalletAdjustForm } from '../../utils/rewardValidation'
import RewardsModalShell, {
  RewardsModalField,
  RewardsFormModalFooter,
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

  const handleReset = () => {
    setForm({ studentId: '', amount: '', reason: '' })
    setErrors({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { valid, errors: nextErrors } = validateWalletAdjustForm(form)
    setErrors(nextErrors)
    if (!valid) return
    onSubmit({ ...form, amount: Number(form.amount), type: mode })
  }

  const title = isCredit ? 'Manual Credit' : 'Manual Debit'

  return (
    <RewardsModalShell
      open={open}
      onClose={onClose}
      title={title}
      description={isCredit ? 'Add coins to a student wallet with an audit reason.' : 'Remove coins from a student wallet with confirmation.'}
      icon={Wallet}
      footer={
        <RewardsFormModalFooter
          isEditMode={false}
          onReset={handleReset}
          isSubmitting={loading}
          createLabel={isCredit ? 'Credit Coins' : 'Debit Coins'}
          resetLabel="Reset"
          form="wallet-adjust-form"
        />
      }
    >
      <form id="wallet-adjust-form" onSubmit={handleSubmit} className={REWARDS_MODAL_FIELD_GAP}>
        <RewardsModalField label="Student" error={errors.studentId} required>
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
        <RewardsModalField label="Coin Amount (1S)" error={errors.amount} required>
          <input
            type="number"
            min="1"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Enter amount"
            className={rewardsModalInputClass(errors.amount)}
          />
        </RewardsModalField>
        <RewardsModalField label="Reason" error={errors.reason} required>
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
