import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, CheckCircle2 } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { isQuestionComplete } from '../../../utils/testSeriesQuestionSlots'
import { examInputClass } from './examFormStyles'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>
}

function QuestionBlockCard({
  slotNo,
  draft,
  blockErrors = {},
  expanded,
  onToggle,
  onDraftChange,
  onSave,
  onReset,
  disabled,
  duplicateWarning,
}) {
  const complete = isQuestionComplete({
    question: draft.question,
    options: [draft.option1, draft.option2, draft.option3, draft.option4],
    answer: draft.answer,
  })

  return (
    <article
      id={`question-block-${slotNo}`}
      className={cn(
        'overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow',
        expanded ? 'border-[#55ace7]/40 shadow-md' : 'border-[#eef2fc]',
        complete && !expanded && 'border-emerald-200/80',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="sticky top-0 z-[1] flex w-full items-center gap-3 border-b border-transparent bg-white px-4 py-3.5 text-left transition hover:bg-[#fafcff]"
      >
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
            complete ? 'bg-emerald-100 text-emerald-800' : 'bg-[#d1e9f6] text-[#246392]',
          )}
        >
          {slotNo}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#111]">Question #{slotNo}</p>
          <p className="line-clamp-1 text-xs text-[#686868]">
            {draft.question?.trim() || 'Not filled yet'}
          </p>
        </div>
        {complete ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        ) : null}
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-[#246392] transition', expanded && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-[#eef2fc] bg-[#fafcff] px-4 py-5 sm:px-5">
              {duplicateWarning ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  {duplicateWarning}
                </p>
              ) : null}

              <div>
                <label className="mb-1.5 block text-sm font-bold text-[#111]">
                  Question Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={disabled}
                  value={draft.questionNo}
                  onChange={(e) => onDraftChange({ questionNo: e.target.value })}
                  placeholder={`${slotNo}`}
                  className={cn(examInputClass, 'max-w-xs')}
                />
                <FieldError message={blockErrors.questionNo} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-[#111]">Question</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={draft.question}
                  onChange={(e) => onDraftChange({ question: e.target.value })}
                  placeholder="Enter Question"
                  className={examInputClass}
                />
                <FieldError message={blockErrors.question} />
              </div>

              {['option1', 'option2', 'option3', 'option4'].map((key, i) => (
                <div
                  key={key}
                  className="grid gap-2 sm:grid-cols-[88px_1fr] sm:items-center sm:gap-4"
                >
                  <label className="text-sm font-bold text-[#111]">Option {i + 1}</label>
                  <div>
                    <input
                      type="text"
                      disabled={disabled}
                      value={draft[key]}
                      onChange={(e) => onDraftChange({ [key]: e.target.value })}
                      placeholder={`Enter Option ${i + 1}`}
                      className={examInputClass}
                    />
                  </div>
                </div>
              ))}
              <FieldError message={blockErrors.options} />

              <div className="grid gap-2 sm:grid-cols-[88px_1fr] sm:items-center sm:gap-4">
                <label className="text-sm font-bold text-[#111]">Correct Answer</label>
                <div>
                  <select
                    disabled={disabled}
                    value={draft.answer}
                    onChange={(e) => onDraftChange({ answer: e.target.value })}
                    className={cn(examInputClass, 'appearance-none')}
                  >
                    <option value="">Select correct option</option>
                    <option value="1">Option 1</option>
                    <option value="2">Option 2</option>
                    <option value="3">Option 3</option>
                    <option value="4">Option 4</option>
                  </select>
                  <FieldError message={blockErrors.answer} />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#eef2fc] pt-4">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onReset}
                  className="min-w-[140px] rounded-full bg-gradient-to-r from-[#55ace7] to-[#3d8fd4] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-105 disabled:opacity-50"
                >
                  Reset Question
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onSave}
                  className="min-w-[120px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-50"
                >
                  Save Question
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  )
}

export default memo(QuestionBlockCard)
