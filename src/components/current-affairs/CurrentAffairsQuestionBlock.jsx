import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import {
  CourseFormField,
  CourseInput,
  CourseMediaSlot,
  CourseTextarea,
} from '../courses/CourseFormField'
import { getOptionLetter } from '../../utils/currentAffairsQuestions'
import { cn } from '../../utils/cn'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>
}

function CurrentAffairsQuestionBlock({
  index,
  question,
  errors = {},
  expanded = true,
  onToggle,
  onChange,
  onImageChange,
}) {
  const prefix = `q${index}`
  const update = (patch) => onChange(index, patch)
  const displayNo = question.questionNo || String(index + 1)

  return (
    <article
      id={`ca-question-${displayNo}`}
      className={cn(
        'overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow',
        expanded ? 'border-[#55ace7]/40 shadow-md' : 'border-[#eef2fc]',
      )}
    >
      <div className="flex items-center gap-2 border-b border-[#eef2fc] bg-[#fafcff] px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d1e9f6] text-sm font-bold text-[#246392]">
            {displayNo}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#111]">Question {displayNo}</p>
            <p className="line-clamp-1 text-xs text-[#686868]">
              {question.question?.trim() || 'Not filled yet'}
            </p>
          </div>
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
            <div className="space-y-4 px-4 py-5 sm:px-5">
              <CourseFormField label="Question Number">
                <CourseInput
                  inputMode="numeric"
                  value={question.questionNo}
                  onChange={(e) => update({ questionNo: e.target.value })}
                  placeholder={displayNo}
                />
              </CourseFormField>

              <CourseFormField label="Question" required>
                <CourseTextarea
                  rows={4}
                  value={question.question}
                  onChange={(e) => update({ question: e.target.value })}
                  placeholder="Enter question"
                  className="min-h-[6rem]"
                />
                <FieldError message={errors[`${prefix}.question`]} />
              </CourseFormField>

              {[0, 1, 2, 3].map((i) => {
                const key = `option${i + 1}`
                const letter = getOptionLetter(i)
                return (
                  <CourseFormField key={key} label={`Option ${letter}`}>
                    <CourseInput
                      value={question[key]}
                      onChange={(e) => update({ [key]: e.target.value })}
                      placeholder={`Enter option ${letter}`}
                    />
                  </CourseFormField>
                )
              })}
              <FieldError message={errors[`${prefix}.options`]} />

              <CourseFormField label="Correct Answer" required>
                <div className="flex flex-wrap gap-4">
                  {[0, 1, 2, 3].map((i) => {
                    const value = String(i + 1)
                    const letter = getOptionLetter(i)
                    return (
                      <label
                        key={value}
                        className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          value={value}
                          checked={question.answer === value}
                          onChange={() => update({ answer: value })}
                          className="h-4 w-4 accent-[#246392]"
                        />
                        Option {letter}
                      </label>
                    )
                  })}
                </div>
                <FieldError message={errors[`${prefix}.answer`]} />
              </CourseFormField>

              <CourseFormField label="Explanation">
                <CourseTextarea
                  rows={3}
                  value={question.explanation}
                  onChange={(e) => update({ explanation: e.target.value })}
                  placeholder="Enter explanation (optional)"
                  className="min-h-[5rem]"
                />
              </CourseFormField>

              <CourseFormField label="Upload Image">
                <CourseMediaSlot
                  placeholder="Optional image"
                  fileName={question.imageName}
                  accept="image/*"
                  uploadProfile="IMAGE_STANDARD"
                  onFileChange={(e) => onImageChange(index, e.target.files?.[0])}
                />
              </CourseFormField>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  )
}

export default memo(CurrentAffairsQuestionBlock)
