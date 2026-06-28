import { FileQuestion } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import QuestionBankStatusBadge from './StatusBadge'
import { ASSERTION_ANSWER_OPTIONS } from '../../utils/questionBankApiHelpers'

function renderTypeSpecificFields(question) {
  const type = question?.type
  const content = question?.content || {}

  if (type === 'MCQ') {
    const options = Array.isArray(content.options) ? content.options : []
    const correctIdx = Number(content.correctOptionIndex ?? -1)
    return (
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
    )
  }

  if (type === 'Numerical') {
    return (
      <div className="mt-5">
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Numerical Answer</h4>
        <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-semibold text-slate-800">
          {content.numericalAnswer || '—'}
        </p>
      </div>
    )
  }

  if (type === 'Match the Following') {
    const left = Array.isArray(content.left) ? content.left : []
    const right = Array.isArray(content.right) ? content.right : []
    return (
      <div className="mt-5 space-y-4">
        {content.prompt ? (
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Prompt</h4>
            <p className="mt-2 text-sm text-slate-800">{content.prompt}</p>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Left</h4>
            <ul className="mt-2 space-y-2">
              {left.filter(Boolean).map((item, idx) => (
                <li key={`l-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Right</h4>
            <ul className="mt-2 space-y-2">
              {right.filter(Boolean).map((item, idx) => (
                <li key={`r-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'Assertion Reason') {
    const label =
      ASSERTION_ANSWER_OPTIONS.find((opt) => opt.value === content.correctAnswer)?.label ||
      content.correctAnswer ||
      '—'
    return (
      <div className="mt-5 space-y-4">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Assertion</h4>
          <p className="mt-2 text-sm text-slate-800">{content.assertion || '—'}</p>
        </div>
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Reason</h4>
          <p className="mt-2 text-sm text-slate-800">{content.reason || '—'}</p>
        </div>
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Correct Answer</h4>
          <p className="mt-2 text-sm font-semibold text-slate-800">{label}</p>
        </div>
      </div>
    )
  }

  return null
}

export default function QuestionDetailDrawer({ open, onClose, question, loading }) {
  if (!open) return null

  const content = question?.content || {}
  const imageUrl = question?.imageUrl || content.imageDataUrl

  return (
    <Modal open={open} onClose={onClose} size="lg" title="View Question" showCloseButton={false}>
      <div className="flex max-h-[min(88vh,760px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader title="View Question" onClose={onClose} icon={FileQuestion} closeVariant="icon" plainCloseIcon />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm font-semibold text-slate-600">
              Loading question...
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[#eef6fc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#246392]">
                  {question?.type || 'Question'}
                </span>
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-700">
                  {question?.category || '—'}
                </span>
                <QuestionBankStatusBadge status={question?.status} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Question Code</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{question?.questionCode || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Subject</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{question?.subject || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Topic</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{question?.topic || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Usage Count</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{question?.usageCount ?? 0}</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-800">
                  {question?.questionPreview || content.question || content.prompt || '—'}
                </p>
              </div>

              {imageUrl ? (
                <div className="mt-5">
                  <img src={imageUrl} alt="Question" className="max-h-64 rounded-xl border border-slate-200 object-contain" />
                </div>
              ) : null}

              {renderTypeSpecificFields(question)}

              {content.explanation || question?.explanation ? (
                <div className="mt-5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Explanation</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                    {content.explanation || question?.explanation}
                  </p>
                </div>
              ) : null}

              {Array.isArray(question?.tags) && question.tags.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
