import { useEffect, useState } from 'react'
import { Settings2 } from 'lucide-react'
import SalesPageShell from '../../components/sales-analytics/SalesPageShell'
import { fetchTrackingConfig, updateTrackingConfig } from '../../api/salesAnalyticsAPI'
import { toast } from '../../utils/toast'

function Toggle({ label, checked, onChange, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-3">
      <div>
        <span className="text-sm font-semibold text-[#111]">{label}</span>
        {description && <p className="mt-0.5 text-xs text-[#686868]">{description}</p>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 rounded accent-[#246392]" />
    </label>
  )
}

export default function TrackingConfigurationPage() {
  const [config, setConfig] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTrackingConfig().then(setConfig)
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await updateTrackingConfig(config)
      toast.success('Tracking configuration saved')
    } catch {
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  if (!config) {
    return (
      <SalesPageShell icon={Settings2} title="Tracking Configuration">
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow" />
      </SalesPageShell>
    )
  }

  return (
    <SalesPageShell
      icon={Settings2}
      title="Tracking Configuration"
      actions={
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-xl bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4d6e] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h3 className="font-bold text-[#111]">Event tracking</h3>
          <Toggle label="Page visit tracking" checked={config.pageVisitTracking} onChange={(v) => setConfig({ ...config, pageVisitTracking: v })} />
          <Toggle label="Click tracking" checked={config.clickTracking} onChange={(v) => setConfig({ ...config, clickTracking: v })} />
          <Toggle label="Scroll depth" checked={config.scrollDepthTracking} onChange={(v) => setConfig({ ...config, scrollDepthTracking: v })} />
          <Toggle label="Payment tracking" checked={config.paymentTracking} onChange={(v) => setConfig({ ...config, paymentTracking: v })} />
          <Toggle label="UTM tracking" checked={config.utmTracking} onChange={(v) => setConfig({ ...config, utmTracking: v })} />
          <Toggle label="Referrer tracking" checked={config.referrerTracking} onChange={(v) => setConfig({ ...config, referrerTracking: v })} />
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h3 className="font-bold text-[#111]">Lead capture popup</h3>
          <Toggle label="Enable popup" checked={config.popupEnabled} onChange={(v) => setConfig({ ...config, popupEnabled: v })} />
          <label className="block text-sm font-semibold text-[#111]">
            Delay (seconds)
            <input
              type="number"
              min={5}
              max={120}
              value={config.popupDelaySeconds}
              onChange={(e) => setConfig({ ...config, popupDelaySeconds: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </label>
          <p className="text-xs text-[#686868]">Shows after user stays on page (default 10s). Captures name, mobile, email, course.</p>
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] lg:col-span-2">
          <h3 className="font-bold text-[#111]">Auto lead creation rules</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(config.autoLeadRules || {}).map(([key, value]) => (
              <Toggle
                key={key}
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                checked={value}
                onChange={(v) =>
                  setConfig({
                    ...config,
                    autoLeadRules: { ...config.autoLeadRules, [key]: v },
                  })
                }
              />
            ))}
          </div>
        </section>
      </div>
    </SalesPageShell>
  )
}
