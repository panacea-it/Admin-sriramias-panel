import { useEffect, useState } from 'react'
import { validateRedemptionSettingsForm } from '../../utils/rewardValidation'
import RewardsModalShell, {
  RewardsModalCancelButton,
  RewardsModalField,
  RewardsModalPrimaryButton,
} from './RewardsModalShell'
import { REWARDS_MODAL_FIELD_GAP, rewardsModalInputClass, rewardsModalTextareaClass } from './rewardsModalUi'

const EMPTY = {
  maxWalletUsagePercent: '',
  minRedemptionCoins: '',
  otpVerificationThreshold: '',
  restrictedCategories: '',
}

export default function RedemptionSettingsModal({ open, onClose, initial, onSave, loading }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) {
      setForm(EMPTY)
      setErrors({})
      return
    }
    if (initial) {
      setForm({
        maxWalletUsagePercent: String(initial.maxWalletUsagePercent ?? ''),
        minRedemptionCoins: String(initial.minRedemptionCoins ?? ''),
        otpVerificationThreshold: String(initial.otpVerificationThreshold ?? ''),
        restrictedCategories: Array.isArray(initial.restrictedCategories)
          ? initial.restrictedCategories.join(', ')
          : '',
      })
    }
  }, [open, initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    const { valid, errors: nextErrors } = validateRedemptionSettingsForm(form)
    setErrors(nextErrors)
    if (!valid) return
    onSave({
      maxWalletUsagePercent: Number(form.maxWalletUsagePercent),
      minRedemptionCoins: Number(form.minRedemptionCoins),
      otpVerificationThreshold: Number(form.otpVerificationThreshold),
      restrictedCategories: form.restrictedCategories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
  }

  return (
    <RewardsModalShell
      open={open}
      onClose={onClose}
      title="Redemption Settings"
      description="Configure wallet usage limits and verification rules."
      footer={
        <>
          <RewardsModalCancelButton onClick={onClose} disabled={loading} />
          <RewardsModalPrimaryButton type="submit" form="redemption-settings-form" loading={loading}>
            Save
          </RewardsModalPrimaryButton>
        </>
      }
    >
      <form id="redemption-settings-form" onSubmit={handleSubmit} className={REWARDS_MODAL_FIELD_GAP}>
        <RewardsModalField label="Maximum Wallet Usage %" error={errors.maxWalletUsagePercent}>
          <input
            type="number"
            min="0"
            max="100"
            value={form.maxWalletUsagePercent}
            onChange={(e) => setForm((f) => ({ ...f, maxWalletUsagePercent: e.target.value }))}
            placeholder="50"
            className={rewardsModalInputClass(errors.maxWalletUsagePercent)}
          />
        </RewardsModalField>
        <RewardsModalField label="Minimum Redemption Coins" error={errors.minRedemptionCoins}>
          <input
            type="number"
            min="0"
            value={form.minRedemptionCoins}
            onChange={(e) => setForm((f) => ({ ...f, minRedemptionCoins: e.target.value }))}
            placeholder="10"
            className={rewardsModalInputClass(errors.minRedemptionCoins)}
          />
        </RewardsModalField>
        <RewardsModalField label="OTP Verification Threshold" error={errors.otpVerificationThreshold}>
          <input
            type="number"
            min="0"
            value={form.otpVerificationThreshold}
            onChange={(e) => setForm((f) => ({ ...f, otpVerificationThreshold: e.target.value }))}
            placeholder="500"
            className={rewardsModalInputClass(errors.otpVerificationThreshold)}
          />
        </RewardsModalField>
        <RewardsModalField
          label="Restricted Categories"
          hint="Comma-separated category keys (e.g. cash, transfer)"
        >
          <textarea
            rows={2}
            value={form.restrictedCategories}
            onChange={(e) => setForm((f) => ({ ...f, restrictedCategories: e.target.value }))}
            placeholder="cash, transfer"
            className={rewardsModalTextareaClass(false)}
          />
        </RewardsModalField>
      </form>
    </RewardsModalShell>
  )
}
