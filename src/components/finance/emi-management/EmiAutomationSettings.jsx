import { useEffect, useState } from 'react'
import FinanceSectionHeader from '../FinanceSectionHeader'
import FinanceToggleSwitch from '../FinanceToggleSwitch'
import { fetchEmiAutomationSettings, updateEmiAutomationSettings } from '../../../api/financeAPI'
import { EMI_SUSPENSION_STATUSES } from '../../../constants/emiManagement'
import { toast } from '../../../utils/toast'

export default function EmiAutomationSettings() {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEmiAutomationSettings().then(setSettings).catch(() => toast.error('Failed to load settings'))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await updateEmiAutomationSettings(settings)
      toast.success('Automation settings saved (cron placeholder)')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!settings) return <div className="h-32 animate-pulse rounded-xl bg-slate-100" />

  return (
    <div className="space-y-4">
      <FinanceSectionHeader
        title="Auto course suspension"
        subtitle="Job-based automation — unpaid EMI beyond threshold suspends course access"
      />
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-900">
        Students receive a warning {settings.warningDaysBeforeSuspend} days before suspension. Grace period:{' '}
        {settings.gracePeriodDays} days.
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">
          <span className="font-medium text-[#686868]">Suspend after (days unpaid)</span>
          <input
            type="number"
            min={1}
            value={settings.suspensionDays}
            onChange={(e) => setSettings((s) => ({ ...s, suspensionDays: Number(e.target.value) }))}
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-[#686868]">Grace period (days)</span>
          <input
            type="number"
            min={0}
            value={settings.gracePeriodDays}
            onChange={(e) => setSettings((s) => ({ ...s, gracePeriodDays: Number(e.target.value) }))}
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-[#686868]">Warning before suspend (days)</span>
          <input
            type="number"
            min={0}
            value={settings.warningDaysBeforeSuspend}
            onChange={(e) => setSettings((s) => ({ ...s, warningDaysBeforeSuspend: Number(e.target.value) }))}
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
          />
        </label>
      </div>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[#686868]">Auto-reactivate after payment</span>
        <FinanceToggleSwitch
          checked={settings.autoReactivateOnPayment}
          onChange={(v) => setSettings((s) => ({ ...s, autoReactivateOnPayment: v }))}
          aria-label="Auto-reactivate after payment"
        />
      </label>
      <p className="text-xs text-[#686868]">
        Status flow: {EMI_SUSPENSION_STATUSES.join(' → ')}
      </p>
      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4d73] disabled:opacity-60"
      >
        Save automation rules
      </button>
    </div>
  )
}
