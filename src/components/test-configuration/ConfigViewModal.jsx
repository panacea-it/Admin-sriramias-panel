import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { stripHtml } from '../../utils/testConfigurationValidation'

export default function ConfigViewModal({ open, onClose, title, row, fields }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  if (!open && !mounted) return null

  return (
    <Modal open={open} onClose={onClose} size="lg" title={title}>
      <div className="flex max-h-[min(88vh,720px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader title={title} onBack={onClose} icon={FileText} />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            {row ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                {fields.map(({ key, label, render }) => (
                  <div key={key} className={key === 'instructions' || key === 'description' ? 'sm:col-span-2' : ''}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-[#111]">
                      {render ? render(row) : String(row[key] ?? '—')}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-[#6b7280]">No details available.</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function renderHtmlField(value) {
  const text = stripHtml(value)
  if (!text) return '—'
  return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
}
