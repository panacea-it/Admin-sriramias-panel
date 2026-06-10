import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { Layers } from 'lucide-react'

export default function FreeResourcePreviewModal({ open, onClose, title, questions = [] }) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Preview Mock Test" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        <ModalPanelHeader title="Preview Mock Test" onClose={onClose} icon={Layers} closeVariant="icon" />
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          <h3 className="text-center text-lg font-bold text-[#246392]">{title || 'Untitled'}</h3>
          <p className="text-center text-sm text-[#686868]">{questions.length} questions</p>
          <ol className="space-y-4">
            {questions.map((q, i) => (
              <li
                key={q.id || i}
                className="rounded-xl border border-[#eef2fc] bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-bold text-[#111]">
                  Q{i + 1}.{' '}
                  <span
                    dangerouslySetInnerHTML={{
                      __html: q.question || '<em>Empty question</em>',
                    }}
                  />
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {(q.options || []).map((o) => (
                    <li
                      key={o.id}
                      className={
                        (q.correctAnswers || []).includes(o.id)
                          ? 'font-semibold text-emerald-700'
                          : ''
                      }
                    >
                      {o.label}. {o.text || '—'}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  )
}
