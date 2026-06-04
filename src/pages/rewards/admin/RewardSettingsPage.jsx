import { useCallback, useEffect, useState } from 'react'
import { Settings2, Save } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import { PAID_STUDENT_REWARDS, FREE_STUDENT_REWARDS } from '../../../constants/rewards'
import { getRewardSettings, updateRewardSettings } from '../../../services/rewardService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '@/utils/toast'

export default function RewardSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getRewardSettings()
      setSettings(data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load settings'))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    setSaving(true)
    try {
      await updateRewardSettings(settings)
      toast.success('Settings saved')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  if (!settings) return null

  return (
    <RewardsPageShell
      icon={Settings2}
      title="Reward Settings"
      actions={
        <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 py-2.5 text-sm font-semibold text-white">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save'}
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsCard title="Coin expiry & limits">
          <NumberField label="Coin expiry (days)" value={settings.coinExpiryDays} onChange={(v) => setSettings((s) => ({ ...s, coinExpiryDays: v }))} />
          <NumberField label="Max redemption %" value={settings.maxRedemptionPercent} onChange={(v) => setSettings((s) => ({ ...s, maxRedemptionPercent: v }))} />
          <NumberField label="Referral daily limit" value={settings.referralDailyLimit} onChange={(v) => setSettings((s) => ({ ...s, referralDailyLimit: v }))} />
          <NumberField label="Fraud risk threshold" value={settings.fraudRiskThreshold} onChange={(v) => setSettings((s) => ({ ...s, fraudRiskThreshold: v }))} />
        </SettingsCard>
        <SettingsCard title="Notifications">
          {['notifyCoinsEarned', 'notifyCoinsRedeemed', 'notifyBadgeUnlocked', 'notifyCoinsExpiring', 'notifyReferralReward'].map((key) => (
            <label key={key} className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={Boolean(settings[key])}
                onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
                className="h-4 w-4 accent-[#246392]"
              />
              <span className="text-sm font-medium text-slate-700">{key.replace('notify', '').replace(/([A-Z])/g, ' $1')}</span>
            </label>
          ))}
        </SettingsCard>
      </div>
      <details className="mt-4 rounded-xl bg-white p-5 shadow-md">
        <summary className="cursor-pointer text-sm font-bold text-slate-900">Reward engine catalog (reference)</summary>
        <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
          {JSON.stringify({ paid: PAID_STUDENT_REWARDS, free: FREE_STUDENT_REWARDS }, null, 2)}
        </pre>
      </details>
    </RewardsPageShell>
  )
}

function SettingsCard({ title, children }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-md">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
      />
    </label>
  )
}
