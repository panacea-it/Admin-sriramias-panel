import { FileQuestion } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { StatusBadge } from '../academics/AcademicsUi'

export default function QuestionPreviewModal({ open, onClose, question }) {
  if (!question) return null
  const { category = 'Prelims', content = {} } = question
  const options = Array.isArray(content.options) ? content.options : []
  const correctIdx = Number(content.correctOptionIndex ?? -1)
  const typeLabel = category === 'Prelims' ? 'Multiple Choice (Prelims)' : 'Descriptive (Mains)'

  return (
    <Modal open={open} onClose={onClose} size="lg" title="View Question" showCloseButton={false}>
      <div className="flex max-h-[min(88vh,760px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader title="View Question" onClose={onClose} icon={FileQuestion} closeVariant="icon" plainCloseIcon />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#eef6fc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#246392]">
                {typeLabel}
              </span>
              <span className="shrink-0">
                <StatusBadge status={question.status} />
              </span>
            </div>

            <div className="mt-4">
              <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-800">
                {content.question}
              </p>
            </div>

            {category === 'Prelims' && (
              <div className="mt-5 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Options</h4>
                <ol className="space-y-2">
                  {options.slice(0, 4).map((opt, idx) => (
                    <li
                      key={`${idx}-${opt}`}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm"
                    >
                      <span className="text-slate-800">
                        <span className="mr-2 font-bold text-slate-500">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                      </span>
                      {idx === correctIdx ? (
                        <span className="shrink-0 rounded-lg bg-[#55ace7]/15 px-3 py-1 text-xs font-bold text-[#246392]">
                          Correct
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

