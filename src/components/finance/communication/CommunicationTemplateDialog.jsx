import { useEffect, useMemo, useState } from 'react'
import { FileText, Eye, Send } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import {
  COMMUNICATION_CHANNEL_OPTIONS,
  TEMPLATE_DYNAMIC_VARIABLES,
} from '../../../constants/paymentCommunicationConstants'
import { applyTemplateVariables } from '../../../utils/paymentCommunicationTemplates'

export default function CommunicationTemplateDialog({ open, template, onClose, onSave, onTestSend, saving }) {
  const isEdit = !!template?.id
  const [form, setForm] = useState({
    name: '',
    channel: 'All channels',
    status: 'Active',
    subject: '',
    body: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        name: template?.name || '',
        channel: template?.channel || 'All channels',
        status: template?.status || 'Active',
        subject: template?.subject || '',
        body: template?.body || '',
      })
    }
  }, [open, template])

  const previewSubject = useMemo(() => applyTemplateVariables(form.subject), [form.subject])
  const previewBody = useMemo(() => applyTemplateVariables(form.body), [form.body])

  const inputClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave?.({
      ...form,
      ...(isEdit && template?.type ? { type: template.type } : {}),
    })
  }

  return (
    <Modal open={open} onClose={onClose} size="xl" title={isEdit ? 'Edit template' : 'Add template'} showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title={isEdit ? 'Edit communication template' : 'New communication template'}
          subtitle="Configure message content with dynamic variables"
          onClose={onClose}
          closeVariant="icon"
          plainCloseIcon
          icon={FileText}
        />
        <form onSubmit={handleSubmit} className="grid gap-0 lg:grid-cols-2">
          <div className="space-y-4 border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#686868]">Template name</span>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#686868]">Channel</span>
              <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))} className={inputClass}>
                {COMMUNICATION_CHANNEL_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#686868]">Status</span>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputClass}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            {form.channel === 'Email' && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[#686868]">Subject line</span>
                <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className={inputClass} />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#686868]">Message body</span>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={6}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20"
                required
              />
            </label>
            <div>
              <p className="mb-2 text-xs font-semibold text-[#686868]">Dynamic variables</p>
              <div className="flex flex-wrap gap-1">
                {TEMPLATE_DYNAMIC_VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, body: `${f.body}${v}` }))}
                    className="rounded bg-[#eef6fc] px-2 py-1 font-mono text-[10px] text-[#246392] hover:bg-[#55ace7]/20"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#686868] hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onTestSend?.({ ...form, templateId: template?.id })}
                className="inline-flex items-center gap-1 rounded-lg border border-[#55ace7] px-4 py-2 text-sm font-semibold text-[#246392]"
              >
                <Send className="h-4 w-4" /> Test send
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : isEdit ? 'Update template' : 'Create template'}
              </button>
            </div>
          </div>

          <div className="bg-[#f7f9fc] p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a3a5c]">
              <Eye className="h-4 w-4" /> Live preview
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {form.channel === 'Email' && previewSubject && (
                <p className="mb-2 border-b border-slate-100 pb-2 text-sm font-semibold">{previewSubject}</p>
              )}
              <p className="whitespace-pre-wrap text-sm text-[#333]">{previewBody || 'Message preview will appear here…'}</p>
            </div>
            <p className="mt-3 text-xs text-[#686868]">Preview uses sample data for dynamic variables.</p>
          </div>
        </form>
      </div>
    </Modal>
  )
}
