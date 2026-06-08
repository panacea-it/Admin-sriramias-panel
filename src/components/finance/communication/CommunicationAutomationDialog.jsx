import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import {
  AUTOMATION_TRIGGER_EVENTS,
  AUTOMATION_TRIGGER_TIMINGS,
  COMMUNICATION_CHANNELS,
} from '../../../constants/paymentCommunicationConstants'

export default function CommunicationAutomationDialog({ open, rule, templates = [], onClose, onSave, saving }) {
  const isEdit = !!rule?.id
  const [form, setForm] = useState({
    name: '',
    triggerEvent: AUTOMATION_TRIGGER_EVENTS[0],
    triggerTiming: AUTOMATION_TRIGGER_TIMINGS[0],
    channel: 'WhatsApp',
    templateId: '',
    audience: 'All students',
    escalationLevel: 'Low',
    active: true,
    priority: 1,
    reminderFrequency: 'Once',
    autoStopCondition: 'Payment received',
  })

  useEffect(() => {
    if (open) {
      setForm({
        name: rule?.name || '',
        triggerEvent: rule?.triggerEvent || AUTOMATION_TRIGGER_EVENTS[0],
        triggerTiming: rule?.triggerTiming || AUTOMATION_TRIGGER_TIMINGS[0],
        channel: rule?.channel || 'WhatsApp',
        templateId: rule?.templateId || templates[0]?.id || '',
        audience: rule?.audience || 'All students',
        escalationLevel: rule?.escalationLevel || 'Low',
        active: rule?.active !== false,
        priority: rule?.priority ?? 1,
        reminderFrequency: rule?.reminderFrequency || 'Once',
        autoStopCondition: rule?.autoStopCondition || 'Payment received',
      })
    }
  }, [open, rule, templates])

  const selectClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

  const handleSubmit = (e) => {
    e.preventDefault()
    const tpl = templates.find((t) => t.id === form.templateId)
    onSave?.({ ...form, templateName: tpl?.name })
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={isEdit ? 'Edit rule' : 'Create rule'}>
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title={isEdit ? 'Edit automation rule' : 'Create automation rule'}
          subtitle="Configure trigger, timing, and template"
          onClose={onClose}
          icon={Zap}
        />
        <form onSubmit={handleSubmit} className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Rule name</span>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={selectClass} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Trigger event</span>
            <select value={form.triggerEvent} onChange={(e) => setForm((f) => ({ ...f, triggerEvent: e.target.value }))} className={selectClass}>
              {AUTOMATION_TRIGGER_EVENTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Trigger timing</span>
            <select value={form.triggerTiming} onChange={(e) => setForm((f) => ({ ...f, triggerTiming: e.target.value }))} className={selectClass}>
              {AUTOMATION_TRIGGER_TIMINGS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Channel</span>
            <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))} className={selectClass}>
              {COMMUNICATION_CHANNELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Template</span>
            <select value={form.templateId} onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))} className={selectClass} required>
              <option value="">Select template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Audience</span>
            <input value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))} className={selectClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Escalation level</span>
            <select value={form.escalationLevel} onChange={(e) => setForm((f) => ({ ...f, escalationLevel: e.target.value }))} className={selectClass}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Reminder frequency</span>
            <input value={form.reminderFrequency} onChange={(e) => setForm((f) => ({ ...f, reminderFrequency: e.target.value }))} className={selectClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Auto-stop condition</span>
            <input value={form.autoStopCondition} onChange={(e) => setForm((f) => ({ ...f, autoStopCondition: e.target.value }))} className={selectClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Priority</span>
            <input type="number" min={1} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} className={selectClass} />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            <span className="text-sm font-semibold text-[#686868]">Active</span>
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#686868] hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Update rule' : 'Create rule'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
