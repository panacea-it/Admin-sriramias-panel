import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { REWARD_EVENT_TYPES, RULE_STATUS } from '../../constants/rewards'
import { validateRewardRuleForm } from '../../utils/rewardValidation'
import Switch from '../admin-management/ui/Switch'
import RewardsModalShell, {
  RewardsModalField,
  RewardsFormModalFooter,
} from './RewardsModalShell'
import { REWARDS_MODAL_FIELD_GAP, rewardsModalInputClass } from './rewardsModalUi'

const EMPTY = {
  name: '',
  eventType: '',
  rewardValue: '',
  dailyLimit: '',
  monthlyLimit: '',
  expiryDays: '',
  status: RULE_STATUS.ACTIVE,
}

function ruleToForm(rule) {
  return {
    name: rule.name ?? '',
    eventType: rule.eventType ?? '',
    rewardValue: String(rule.rewardValue ?? ''),
    dailyLimit: String(rule.dailyLimit ?? ''),
    monthlyLimit: String(rule.monthlyLimit ?? ''),
    expiryDays: String(rule.expiryDays ?? ''),
    status: rule.status ?? RULE_STATUS.ACTIVE,
  }
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
    setForm(initial ? ruleToForm(initial) : EMPTY)
  }, [open, initial])

  const handleReset = () => {
    setForm(initial ? ruleToForm(initial) : EMPTY)
    setErrors({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { valid, errors: nextErrors } = validateRewardRuleForm(form)
    setErrors(nextErrors)
    if (!valid) return
    onSubmit({
      name: form.name.trim(),
      eventType: form.eventType,
      rewardValue: Number(form.rewardValue),
      dailyLimit: Number(form.dailyLimit),
      monthlyLimit: Number(form.monthlyLimit),
      expiryDays: Number(form.expiryDays),
      status: form.status,
    })
  }

  return (
    <RewardsModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Reward Rule' : 'Create Reward Rule'}
      icon={ScrollText}
      size="lg"
      footer={
        <RewardsFormModalFooter
          isEditMode={isEdit}
          onReset={handleReset}
          isSubmitting={loading}
          createLabel="Create Rule"
          updateLabel="Update Rule"
          form="reward-rule-form"
        />
      }
    >
      <form id="reward-rule-form" onSubmit={handleSubmit} className={REWARDS_MODAL_FIELD_GAP}>
        <RewardsModalField label="Rule Name" error={errors.name} required>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Daily Login Bonus"
            className={rewardsModalInputClass(errors.name)}
          />
        </RewardsModalField>
        <RewardsModalField label="Event Type" error={errors.eventType} required>
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
        <div className="grid gap-5 sm:grid-cols-2">
          <RewardsModalField label="Reward Value (1S)" error={errors.rewardValue} required>
            <input
              type="number"
              min="0"
              value={form.rewardValue}
              onChange={(e) => setForm((f) => ({ ...f, rewardValue: e.target.value }))}
              placeholder="0"
              className={rewardsModalInputClass(errors.rewardValue)}
            />
          </RewardsModalField>
          <RewardsModalField label="Daily Limit" error={errors.dailyLimit} required>
            <input
              type="number"
              min="0"
              value={form.dailyLimit}
              onChange={(e) => setForm((f) => ({ ...f, dailyLimit: e.target.value }))}
              placeholder="e.g. 10"
              className={rewardsModalInputClass(errors.dailyLimit)}
            />
          </RewardsModalField>
          <RewardsModalField label="Monthly Limit" error={errors.monthlyLimit} required>
            <input
              type="number"
              min="0"
              value={form.monthlyLimit}
              onChange={(e) => setForm((f) => ({ ...f, monthlyLimit: e.target.value }))}
              placeholder="e.g. 100"
              className={rewardsModalInputClass(errors.monthlyLimit)}
            />
          </RewardsModalField>
          <RewardsModalField label="Expiry Days" error={errors.expiryDays} required>
            <input
              type="number"
              min="0"
              value={form.expiryDays}
              onChange={(e) => setForm((f) => ({ ...f, expiryDays: e.target.value }))}
              placeholder="e.g. 90"
              className={rewardsModalInputClass(errors.expiryDays)}
            />
          </RewardsModalField>
        </div>
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
