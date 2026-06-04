import { useEffect, useState } from 'react'
import { REWARD_EVENT_TYPES, RULE_STATUS } from '../../constants/rewards'
import { validateRewardRuleForm } from '../../utils/rewardValidation'
import Switch from '../admin-management/ui/Switch'
import RewardsModalShell, {
  RewardsModalCancelButton,
  RewardsModalField,
  RewardsModalPrimaryButton,
} from './RewardsModalShell'
import { REWARDS_MODAL_FIELD_GAP, rewardsModalInputClass } from './rewardsModalUi'

const EMPTY = {
  name: '',
  eventType: '',
  rewardValue: '',
  status: RULE_STATUS.ACTIVE,
}

export default function RewardRuleFormModal({ open, onClose, initial, onSubmit, loading }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const isEdit = Boolean(initial)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY)
      setErrors({})
      return
    }
    if (initial) {
      setForm({
        name: initial.name ?? '',
        eventType: initial.eventType ?? '',
        rewardValue: String(initial.rewardValue ?? ''),
        status: initial.status ?? RULE_STATUS.ACTIVE,
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    const { valid, errors: nextErrors } = validateRewardRuleForm(form)
    setErrors(nextErrors)
    if (!valid) return
    const payload = {
      name: form.name.trim(),
      eventType: form.eventType,
      rewardValue: Number(form.rewardValue),
      status: form.status,
    }
    if (isEdit && initial) {
      payload.dailyLimit = initial.dailyLimit
      payload.monthlyLimit = initial.monthlyLimit
      payload.expiryDays = initial.expiryDays
    }
    onSubmit(payload)
  }

  return (
    <RewardsModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Reward Rule' : 'Create Reward Rule'}
      footer={
        <>
          <RewardsModalCancelButton onClick={onClose} disabled={loading} />
          <RewardsModalPrimaryButton type="submit" form="reward-rule-form" loading={loading}>
            {isEdit ? 'Update' : 'Create Rule'}
          </RewardsModalPrimaryButton>
        </>
      }
    >
      <form id="reward-rule-form" onSubmit={handleSubmit} className={REWARDS_MODAL_FIELD_GAP}>
        <RewardsModalField label="Rule Name" error={errors.name}>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Daily Login Bonus"
            className={rewardsModalInputClass(errors.name)}
          />
        </RewardsModalField>
        <RewardsModalField label="Event Type" error={errors.eventType}>
          <select
            value={form.eventType}
            onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
            className={rewardsModalInputClass(errors.eventType)}
          >
            <option value="">Select event type</option>
            {REWARD_EVENT_TYPES.map((ev) => (
              <option key={ev.value} value={ev.value}>
                {ev.label}
              </option>
            ))}
          </select>
        </RewardsModalField>
        <RewardsModalField label="Reward Value (1S)" error={errors.rewardValue}>
          <input
            type="number"
            min="0"
            value={form.rewardValue}
            onChange={(e) => setForm((f) => ({ ...f, rewardValue: e.target.value }))}
            placeholder="0"
            className={rewardsModalInputClass(errors.rewardValue)}
          />
        </RewardsModalField>
        <RewardsModalField label="Status">
          <Switch
            id="reward-rule-status"
            checked={form.status === RULE_STATUS.ACTIVE}
            onChange={(checked) =>
              setForm((f) => ({
                ...f,
                status: checked ? RULE_STATUS.ACTIVE : RULE_STATUS.INACTIVE,
              }))
            }
            label="Rule active"
            description="Inactive rules will not issue rewards"
          />
        </RewardsModalField>
      </form>
    </RewardsModalShell>
  )
}
