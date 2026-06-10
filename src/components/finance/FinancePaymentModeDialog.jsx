import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import FinanceSettingsPanelShell from './FinanceSettingsPanelShell'
import FinanceToggleSwitch from './FinanceToggleSwitch'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import { FINANCE_PAYMENT_MODE_CATEGORIES, FINANCE_PAYMENT_MODE_ICON_OPTIONS } from '../../constants/financeConstants'
import { validatePaymentModeForm } from '../../utils/finance/paymentModeUtils'
import { cn } from '../../utils/cn'

const FIELD_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]'

const EMPTY_FORM = {
  label: '',
  category: 'online',
  description: '',
  icon: 'circle-dot',
  enabled: true,
}

export default function FinancePaymentModeDialog({
  open,
  onClose,
  onSubmit,
  mode = null,
  existingModes = [],
  readOnly = false,
}) {
  const isEdit = !!mode
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    if (mode) {
      setForm({
        label: mode.label || '',
        category: mode.category || 'online',
        description: mode.description || '',
        icon: mode.icon || 'circle-dot',
        enabled: mode.enabled !== false,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [open, mode])

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleReset = () => {
    if (mode) {
      setForm({
        label: mode.label || '',
        category: mode.category || 'online',
        description: mode.description || '',
        icon: mode.icon || 'circle-dot',
        enabled: mode.enabled !== false,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (readOnly) return
    const nextErrors = validatePaymentModeForm(form, existingModes, mode?.id)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    onSubmit?.(form, mode)
  }

  return (
    <FinanceSettingsPanelShell
      open={open}
      onClose={onClose}
      zIndex={120}
      size="md"
      className="sm:max-w-lg"
      title={isEdit ? 'Edit payment mode' : 'Add payment mode'}
      subtitle={
        isEdit
          ? 'Update labels, category, or availability.'
          : 'Create a custom mode for filters and payment workflows.'
      }
      icon={CreditCard}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#222]">Payment mode name</span>
          <input
            value={form.label}
            onChange={update('label')}
            disabled={readOnly}
            placeholder="e.g. Paytm, PhonePe, RTGS"
            className={cn(FIELD_CLASS, errors.label && 'border-[#df8284]')}
          />
          {errors.label && <span className="mt-1 block text-xs text-[#df8284]">{errors.label}</span>}
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#222]">Category</span>
          <select value={form.category} onChange={update('category')} disabled={readOnly} className={FIELD_CLASS}>
            {FINANCE_PAYMENT_MODE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#222]">Description</span>
          <textarea
            value={form.description}
            onChange={update('description')}
            disabled={readOnly}
            rows={3}
            placeholder="Optional — shown in settings and admin help text"
            className={cn(FIELD_CLASS, 'min-h-[80px] resize-y py-2')}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#222]">Icon</span>
          <select value={form.icon} onChange={update('icon')} disabled={readOnly} className={FIELD_CLASS}>
            {FINANCE_PAYMENT_MODE_ICON_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#222]">Active on save</p>
            <p className="text-xs text-[#686868]">Inactive modes are hidden from payment workflows</p>
          </div>
          <FinanceToggleSwitch
            checked={form.enabled}
            onChange={(val) => setForm((f) => ({ ...f, enabled: val }))}
            disabled={readOnly}
            aria-label="Active on save"
            size="md"
          />
        </div>

        {!readOnly && (
          <FormModalSubmitBar
            isEditMode={isEdit}
            createLabel="Add mode"
            updateLabel="Save changes"
            onReset={handleReset}
          />
        )}
      </form>
    </FinanceSettingsPanelShell>
  )
}
