import { useEffect, useState } from 'react'
import { Bell, MessageCircle, Mail, Smartphone } from 'lucide-react'
import FinanceSectionHeader from '../FinanceSectionHeader'
import FinanceTimeline from '../FinanceTimeline'
import {
  EMI_REMINDER_CHANNELS,
  EMI_REMINDER_TRIGGERS,
  EMI_REMINDER_DELIVERY_STATUSES,
} from '../../../constants/emiManagement'
import {
  fetchEmiReminderLogs,
  sendEmiReminder,
  updateEmiAutomationSettings,
  fetchEmiAutomationSettings,
} from '../../../api/financeAPI'
import { applyTemplate } from '../../../utils/emiManagement'
import { toast } from '../../../utils/toast'
import { cn } from '../../../utils/cn'

const CHANNEL_ICONS = { WhatsApp: MessageCircle, SMS: Smartphone, Email: Mail }

function StatusChip({ status }) {
  const styles = {
    Sent: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    Failed: 'bg-red-100 text-red-800 ring-red-200',
    Retry: 'bg-amber-100 text-amber-800 ring-amber-200',
    Queued: 'bg-slate-100 text-slate-700 ring-slate-200',
  }
  return (
    <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ring-1', styles[status] || styles.Queued)}>
      {status}
    </span>
  )
}

export default function EmiReminderPanel({ selectedPlan, onRefresh }) {
  const [settings, setSettings] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, l] = await Promise.all([fetchEmiAutomationSettings(), fetchEmiReminderLogs()])
      setSettings(s)
      setLogs(l || [])
    } catch {
      toast.error('Failed to load reminder settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      await updateEmiAutomationSettings(settings)
      toast.success('Reminder settings saved')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async (channel, trigger) => {
    if (!selectedPlan) {
      toast.error('Select a student from Plans tab first')
      return
    }
    const template = settings?.templates?.[trigger] || ''
    const message = applyTemplate(template, {
      studentName: selectedPlan.studentName,
      amount: selectedPlan.nextEmiAmount,
      dueDate: selectedPlan.nextDueDate,
      courseName: selectedPlan.courseName,
      overdueDays: selectedPlan.overdueDays,
      pendingAmount: selectedPlan.pendingAmount,
    })
    try {
      await sendEmiReminder({
        planId: selectedPlan.id,
        studentName: selectedPlan.studentName,
        mobile: selectedPlan.mobile,
        email: selectedPlan.email,
        channel,
        trigger,
        message,
      })
      toast.success(`${channel} reminder queued`)
      load()
      onRefresh?.()
    } catch {
      toast.error('Reminder failed')
    }
  }

  if (loading || !settings) {
    return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
  }

  const timelineEvents = logs.slice(0, 12).map((log) => ({
    step: `${log.channel} — ${log.trigger || 'reminder'}`,
    detail: `${log.studentName || log.planId || ''} · ${log.deliveryStatus || log.status}`,
    timestamp: log.timestamp,
    status: log.status === 'Failed' ? 'failed' : 'completed',
  }))

  return (
    <div className="space-y-6">
      <FinanceSectionHeader title="Auto reminder system" subtitle="WhatsApp, SMS, and email with configurable triggers" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-[#1a3a5c]">Reminder settings</h4>
          <label className="block text-sm">
            <span className="text-[#686868]">Days before due</span>
            <input
              type="number"
              min={0}
              value={settings.reminderDaysBeforeDue}
              onChange={(e) => setSettings((s) => ({ ...s, reminderDaysBeforeDue: Number(e.target.value) }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#686868]">Reminder frequency (days)</span>
            <input
              type="number"
              min={1}
              value={settings.reminderFrequencyDays}
              onChange={(e) => setSettings((s) => ({ ...s, reminderFrequencyDays: Number(e.target.value) }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          {EMI_REMINDER_TRIGGERS.map((t) => (
            <label key={t.id} className="block text-sm">
              <span className="text-[#686868]">{t.label} template</span>
              <textarea
                rows={2}
                value={settings.templates?.[t.id] || ''}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    templates: { ...s.templates, [t.id]: e.target.value },
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          ))}
          <button
            type="button"
            disabled={saving}
            onClick={saveSettings}
            className="rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4d73] disabled:opacity-60"
          >
            Save settings
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="mb-3 text-sm font-bold text-[#1a3a5c]">Send reminder now</h4>
          <p className="mb-3 text-xs text-[#686868]">
            {selectedPlan
              ? `Target: ${selectedPlan.studentName}`
              : 'Open a plan from the Plans tab to send a targeted reminder.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {EMI_REMINDER_CHANNELS.map((ch) => {
              const Icon = CHANNEL_ICONS[ch] || Bell
              return (
                <button
                  key={ch}
                  type="button"
                  disabled={!selectedPlan}
                  onClick={() => sendTest(ch, 'before_due')}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#246392] hover:bg-[#eef6fc] disabled:opacity-50"
                >
                  <Icon className="h-3.5 w-3.5" /> {ch}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-1">
            {EMI_REMINDER_DELIVERY_STATUSES.map((s) => (
              <StatusChip key={s} status={s} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="mb-3 text-sm font-bold text-[#1a3a5c]">Reminder history</h4>
        {timelineEvents.length === 0 ? (
          <p className="text-sm text-[#686868]">No reminder logs yet.</p>
        ) : (
          <FinanceTimeline events={timelineEvents} />
        )}
      </div>
    </div>
  )
}
