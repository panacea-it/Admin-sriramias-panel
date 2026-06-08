import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, CheckCircle2 } from 'lucide-react'
import { cn } from '../../../utils/cn'
import {
  isPrelimsSectionQuestionComplete,
  PRELIMS_DIFFICULTY_LEVELS,
  PRELIMS_QUESTION_TYPES,
} from '../../../utils/prelimsSectionQuestions'
import { examInputClass } from '../../courses/exam/examFormStyles'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>
}

function PrelimsSectionQuestionBlock({
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
  const complete = isPrelimsSectionQuestionComplete({
    status: draft.status,
    questionText: draft.questionText,
    questionType: draft.questionType,
    options: [draft.option1, draft.option2, draft.option3, draft.option4],
    correctAnswer: draft.correctAnswer,
  })

  const isTrueFalse = draft.questionType === 'trueFalse'
  const isMultiSelect = draft.questionType === 'multiSelect'

  return (
    <article
      id={`section-question-block-${slotNo}`}
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
            {draft.questionText?.trim() || 'Not filled yet'}
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-[#111]">Question Type</label>
                  <select
                    disabled={disabled}
                    value={draft.questionType}
                    onChange={(e) => onDraftChange({ questionType: e.target.value })}
                    className={cn(examInputClass, 'appearance-none')}
                  >
                    {PRELIMS_QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-[#111]">Difficulty Level</label>
                  <select
                    disabled={disabled}
                    value={draft.difficulty}
                    onChange={(e) => onDraftChange({ difficulty: e.target.value })}
                    className={cn(examInputClass, 'appearance-none')}
                  >
                    {PRELIMS_DIFFICULTY_LEVELS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-[#111]">Question Text</label>
                <textarea
                  disabled={disabled}
                  value={draft.questionText}
                  onChange={(e) => onDraftChange({ questionText: e.target.value })}
                  rows={3}
                  placeholder="Enter question text"
                  className="w-full rounded-xl bg-[#d1e9f6] px-4 py-2.5 text-sm text-[#1a3a5c] outline-none focus:ring-2 focus:ring-[#55ace7]/45"
                />
                <FieldError message={blockErrors.questionText} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-[#111]">
                  Upload Question Image (optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    id={`section-q-img-${slotNo}`}
                    disabled={disabled}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      onDraftChange({ image: file?.name || '' })
                    }}
                  />
                  <label
                    htmlFor={`section-q-img-${slotNo}`}
                    className={cn(
                      'flex h-11 cursor-pointer items-center justify-between rounded-xl bg-[#d1e9f6] px-4 text-sm',
                      disabled && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <span className="truncate text-[#7a8a9a]">
                      {draft.image || 'Choose image file'}
                    </span>
                  </label>
                </div>
              </div>

              {(isTrueFalse ? ['option1', 'option2'] : ['option1', 'option2', 'option3', 'option4']).map(
                (key, i) => (
                  <div
                    key={key}
                    className="grid gap-2 sm:grid-cols-[88px_1fr] sm:items-center sm:gap-4"
                  >
                    <label className="text-sm font-bold text-[#111]">
                      Option {String.fromCharCode(65 + i)}
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={draft[key]}
                      onChange={(e) => onDraftChange({ [key]: e.target.value })}
                      placeholder={
                        isTrueFalse
                          ? i === 0
                            ? 'True'
                            : 'False'
                          : `Enter Option ${String.fromCharCode(65 + i)}`
                      }
                      className={examInputClass}
                    />
                  </div>
                ),
              )}
              <FieldError message={blockErrors.options} />

              <div className="grid gap-2 sm:grid-cols-[88px_1fr] sm:items-center sm:gap-4">
                <label className="text-sm font-bold text-[#111]">Correct Answer</label>
                <div>
                  {isMultiSelect ? (
                    <input
                      type="text"
                      disabled={disabled}
                      value={draft.correctAnswer}
                      onChange={(e) => onDraftChange({ correctAnswer: e.target.value })}
                      placeholder="e.g. 1,3"
                      className={examInputClass}
                    />
                  ) : (
                    <select
                      disabled={disabled}
                      value={draft.correctAnswer}
                      onChange={(e) => onDraftChange({ correctAnswer: e.target.value })}
                      className={cn(examInputClass, 'appearance-none')}
                    >
                      <option value="">Select correct option</option>
                      {(isTrueFalse ? [1, 2] : [1, 2, 3, 4]).map((n) => (
                        <option key={n} value={String(n)}>
                          Option {String.fromCharCode(64 + n)}
                        </option>
                      ))}
                    </select>
                  )}
                  <FieldError message={blockErrors.correctAnswer} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-[#111]">Explanation</label>
                <textarea
                  disabled={disabled}
                  value={draft.explanation}
                  onChange={(e) => onDraftChange({ explanation: e.target.value })}
                  rows={2}
                  placeholder="Optional explanation for students"
                  className="w-full rounded-xl bg-[#d1e9f6] px-4 py-2.5 text-sm text-[#1a3a5c] outline-none focus:ring-2 focus:ring-[#55ace7]/45"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-[#111]">
                    Marks Override (optional)
                  </label>
                  <input
                    inputMode="decimal"
                    disabled={disabled}
                    value={draft.marks}
                    onChange={(e) =>
                      onDraftChange({ marks: e.target.value.replace(/[^\d.]/g, '') })
                    }
                    placeholder="Uses section default if empty"
                    className={examInputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-[#111]">
                    Negative Marks Override (optional)
                  </label>
                  <input
                    inputMode="decimal"
                    disabled={disabled}
                    value={draft.negativeMarks}
                    onChange={(e) =>
                      onDraftChange({ negativeMarks: e.target.value.replace(/[^\d.]/g, '') })
                    }
                    placeholder="Uses section default if empty"
                    className={examInputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-[#111]">Status</label>
                <select
                  disabled={disabled}
                  value={draft.status}
                  onChange={(e) => onDraftChange({ status: e.target.value })}
                  className={cn(examInputClass, 'appearance-none sm:max-w-xs')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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

export default memo(PrelimsSectionQuestionBlock)
