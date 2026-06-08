import { memo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, Copy, GripVertical, Trash2 } from 'lucide-react'
import BlogRichEditor from '../../blogs/BlogRichEditor'
import { CourseFormField, CourseInput, CourseSelect } from '../../courses/CourseFormField'
import { cn } from '../../../utils/cn'
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
} from '../../../utils/freeResourceFormConstants'
import { isFreeResourceQuestionComplete, validateFreeResourceQuestion } from '../../../utils/freeResourceFormUtils'
import FormFieldError from './FormFieldError'
import OptionField, { AddOptionButton } from './OptionField'
import UploadField from './UploadField'

function QuestionCard({
  index,
  question,
  expanded,
  onToggle,
  onChange,
  onSave,
  onReset,
  onDelete,
  onDuplicate,
  dragHandleProps,
  disabled,
  light = false,
  blockErrors = {},
}) {
  const [localErrors, setLocalErrors] = useState({})
  const slotNo = index + 1
  const complete = isFreeResourceQuestionComplete(question, { light })
  const errors = { ...localErrors, ...blockErrors }

  const update = (patch) => onChange({ ...question, ...patch, saved: false })

  const handleOptionText = (optId, text) => {
    update({
      options: question.options.map((o) => (o.id === optId ? { ...o, text } : o)),
    })
  }

  const toggleCorrect = (optId) => {
    const current = question.correctAnswers || []
    if (question.optionType === 'single') {
      update({ correctAnswers: current.includes(optId) ? [] : [optId] })
      return
    }
    const next = current.includes(optId)
      ? current.filter((id) => id !== optId)
      : [...current, optId]
    update({ correctAnswers: next })
  }

  const addOption = () => {
    if (question.options.length >= MAX_OPTIONS) return
    const label = String.fromCharCode(65 + question.options.length)
    update({
      options: [
        ...question.options,
        { id: `opt-${Date.now()}`, label, text: '' },
      ],
    })
  }

  const removeOption = (optId) => {
    if (question.options.length <= MIN_OPTIONS) return
    update({
      options: question.options.filter((o) => o.id !== optId),
      correctAnswers: (question.correctAnswers || []).filter((id) => id !== optId),
    })
  }

  const handleSave = () => {
    const errs = validateFreeResourceQuestion(question, index, { light })
    delete errs._slot
    if (Object.keys(errs).length) {
      setLocalErrors(errs)
      return
    }
    setLocalErrors({})
    onSave?.()
  }

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow',
        expanded ? 'border-[#55ace7]/40 shadow-md' : 'border-[#eef2fc]',
        complete && !expanded && 'border-emerald-200/80',
      )}
    >
      <div className="flex items-stretch">
        {dragHandleProps ? (
          <button
            type="button"
            className="flex w-10 shrink-0 cursor-grab items-center justify-center border-r border-[#eef2fc] bg-[#fafcff] text-[#888] active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#fafcff]"
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
            <p className="text-sm font-bold text-[#111]">Question {slotNo}</p>
            <p className="line-clamp-1 text-xs text-[#686868]">
              {question.question?.replace(/<[^>]+>/g, '').trim() || 'Not filled yet'}
            </p>
          </div>
          {complete ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : null}
          <ChevronDown
            className={cn('h-5 w-5 shrink-0 text-[#246392] transition', expanded && 'rotate-180')}
          />
        </button>
      </div>

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
              <CourseFormField label="Question Number">
                <CourseInput readOnly value={String(slotNo)} className="max-w-[120px] bg-[#eef6fc]" />
              </CourseFormField>

              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Question <span className="text-red-500">*</span>
                </p>
                <BlogRichEditor
                  value={question.question}
                  onChange={(html) => update({ question: html })}
                  placeholder="Enter Question"
                  minHeight={light ? 120 : 160}
                />
                <FormFieldError message={errors.question} />
              </div>

              <CourseFormField label="Option Type" required>
                <CourseSelect
                  value={question.optionType}
                  onChange={(e) =>
                    update({
                      optionType: e.target.value,
                      correctAnswers: [],
                    })
                  }
                >
                  <option value="single">Single Correct</option>
                  <option value="multiple">Multiple Correct</option>
                </CourseSelect>
              </CourseFormField>

              <div className="space-y-3">
                <p className="text-sm font-bold text-[#111]">Options</p>
                {question.options.map((opt, optIndex) => (
                  <OptionField
                    key={opt.id}
                    option={{ ...opt, questionId: question.id }}
                    index={optIndex}
                    optionType={question.optionType}
                    checked={(question.correctAnswers || []).includes(opt.id)}
                    onTextChange={(text) => handleOptionText(opt.id, text)}
                    onToggleCorrect={toggleCorrect}
                    onRemove={() => removeOption(opt.id)}
                    canRemove={question.options.length > MIN_OPTIONS}
                    disabled={disabled}
                  />
                ))}
                {question.options.length < MAX_OPTIONS ? (
                  <AddOptionButton onClick={addOption} disabled={disabled} />
                ) : null}
                <FormFieldError message={errors.options || errors.correctAnswers} />
              </div>

              {!light ? (
                <>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-700">Explanation</p>
                    <BlogRichEditor
                      value={question.explanation}
                      onChange={(html) => update({ explanation: html })}
                      placeholder="Enter explanation"
                      minHeight={120}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <UploadField
                      label="Upload question image"
                      profile="IMAGE_STANDARD"
                      accept="image/*"
                      fileName={question.questionImageName}
                      icon="image"
                      onFileNameChange={(name) => update({ questionImageName: name })}
                    />
                    <UploadField
                      label="Upload explanation image"
                      profile="IMAGE_STANDARD"
                      accept="image/*"
                      fileName={question.explanationImageName}
                      icon="image"
                      onFileNameChange={(name) => update({ explanationImageName: name })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <CourseFormField label="Marks">
                      <CourseInput
                        inputMode="decimal"
                        value={question.marks}
                        onChange={(e) => update({ marks: e.target.value })}
                        placeholder="Marks"
                      />
                    </CourseFormField>
                    <CourseFormField label="Negative Marks">
                      <CourseInput
                        inputMode="decimal"
                        value={question.negativeMarks}
                        onChange={(e) => update({ negativeMarks: e.target.value })}
                        placeholder="Negative marks"
                      />
                      <FormFieldError message={errors.negativeMarks} />
                    </CourseFormField>
                  </div>
                </>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#eef2fc] pt-4">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onDuplicate}
                  className="inline-flex items-center gap-2 rounded-full border border-[#cfe8f7] px-5 py-2.5 text-sm font-semibold text-[#246392] hover:bg-white"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onDelete}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onReset}
                  className="min-w-[120px] rounded-full bg-gradient-to-r from-[#5eb8f5] to-[#2b78a5] px-6 py-2.5 text-sm font-bold text-white shadow"
                >
                  Reset Question
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleSave}
                  className="min-w-[120px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow"
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

export default memo(QuestionCard)
