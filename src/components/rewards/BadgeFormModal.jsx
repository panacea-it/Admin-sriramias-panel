import { useEffect, useState } from 'react'
import { RULE_STATUS } from '../../constants/rewards'
import { validateBadgeForm } from '../../utils/rewardValidation'
import Switch from '../admin-management/ui/Switch'
import RewardsModalShell, {
  RewardsModalCancelButton,
  RewardsModalField,
  RewardsModalPrimaryButton,
} from './RewardsModalShell'
import { REWARDS_MODAL_FIELD_GAP, rewardsModalInputClass, rewardsModalTextareaClass } from './rewardsModalUi'

const EMPTY = {
  name: '',
  description: '',
  criteria: '',
  rewardCoins: '',
  status: RULE_STATUS.ACTIVE,
}

export default function BadgeFormModal({ open, onClose, initial, onSubmit, loading }) {
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
        description: initial.description ?? '',
        criteria: initial.criteria ?? '',
        rewardCoins: String(initial.rewardCoins ?? ''),
        status: initial.status ?? RULE_STATUS.ACTIVE,
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    const { valid, errors: nextErrors } = validateBadgeForm(form)
    setErrors(nextErrors)
    if (!valid) return
    onSubmit({ ...form, rewardCoins: Number(form.rewardCoins) })
  }

  return (
    <RewardsModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Badge' : 'Create Badge'}
      footer={
        <>
          <RewardsModalCancelButton onClick={onClose} disabled={loading} />
          <RewardsModalPrimaryButton type="submit" form="badge-form" loading={loading}>
            {isEdit ? 'Update' : 'Save Badge'}
          </RewardsModalPrimaryButton>
        </>
      }
    >
      <form id="badge-form" onSubmit={handleSubmit} className={REWARDS_MODAL_FIELD_GAP}>
        <RewardsModalField label="Badge Icon" hint="PNG or SVG, max 2 MB">
          <input
            type="file"
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            className="block w-full cursor-pointer text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef2fc] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#246392]"
          />
        </RewardsModalField>
        <RewardsModalField label="Badge Name" error={errors.name}>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Badge name"
            className={rewardsModalInputClass(errors.name)}
          />
        </RewardsModalField>
        <RewardsModalField label="Description">
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short description shown to students"
            className={rewardsModalTextareaClass(false)}
          />
        </RewardsModalField>
        <RewardsModalField label="Criteria" error={errors.criteria}>
          <textarea
            rows={2}
            value={form.criteria}
            onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))}
            placeholder="What the student must achieve"
            className={rewardsModalTextareaClass(errors.criteria)}
          />
        </RewardsModalField>
        <RewardsModalField label="Reward Coins" error={errors.rewardCoins}>
          <input
            type="number"
            min="0"
            value={form.rewardCoins}
            onChange={(e) => setForm((f) => ({ ...f, rewardCoins: e.target.value }))}
            placeholder="0"
            className={rewardsModalInputClass(errors.rewardCoins)}
          />
        </RewardsModalField>
        <RewardsModalField label="Status">
          <Switch
            id="badge-status"
            checked={form.status === RULE_STATUS.ACTIVE}
            onChange={(checked) =>
              setForm((f) => ({
                ...f,
                status: checked ? RULE_STATUS.ACTIVE : RULE_STATUS.INACTIVE,
              }))
            }
            label="Badge active"
          />
        </RewardsModalField>
      </form>
    </RewardsModalShell>
  )
}
