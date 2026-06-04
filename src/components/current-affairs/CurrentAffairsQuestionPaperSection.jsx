import { useCallback, useEffect, useMemo, useState } from 'react'
import { Upload } from 'lucide-react'
import { toast } from '@/utils/toast'
import SectionBar from '../courses/SectionBar'
import { CourseFormField, CourseInput } from '../courses/CourseFormField'
import {
  generateQuestionsFromRange,
  parseSectionRange,
  QUESTION_LIST_RENDER_CHUNK,
} from '../../utils/currentAffairsQuestions'
import CurrentAffairsBulkUploadModal from './CurrentAffairsBulkUploadModal'
import CurrentAffairsQuestionBlock from './CurrentAffairsQuestionBlock'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>
}

function questionsMatchRange(existing, generated) {
  if (existing.length !== generated.length) return false
  return generated.every(
    (q, i) =>
      q.id === existing[i]?.id && String(q.questionNo) === String(existing[i]?.questionNo),
  )
}

export default function CurrentAffairsQuestionPaperSection({
  form,
  errors,
  onPatch,
  resetKey = 0,
}) {
  const [bulkOpen, setBulkOpen] = useState(false)
  const [rangeErrors, setRangeErrors] = useState({})
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [listWindow, setListWindow] = useState(QUESTION_LIST_RENDER_CHUNK)

  const questions = form.questions || []

  const rangePreview = useMemo(
    () => parseSectionRange(form.sectionFrom, form.sectionTo),
    [form.sectionFrom, form.sectionTo],
  )

  const setQuestions = useCallback(
    (next) => {
      onPatch({ questions: next })
    },
    [onPatch],
  )

  const syncRangeErrors = useCallback((from, to) => {
    const result = parseSectionRange(from, to)
    setRangeErrors(result.fieldErrors)
    return result
  }, [])

  const applyRangeGeneration = useCallback(
    (options = {}) => {
      const { silent = false } = options
      const result = syncRangeErrors(form.sectionFrom, form.sectionTo)

      if (!result.valid) {
        if (!silent) {
          const msg =
            result.fieldErrors.sectionRange ||
            result.fieldErrors.sectionFrom ||
            result.fieldErrors.sectionTo ||
            'Enter a valid From and To range'
          toast.error(msg)
        }
        return false
      }

      const generated = generateQuestionsFromRange(result.from, result.to, questions)
      setQuestions(generated)
      setListWindow(Math.max(QUESTION_LIST_RENDER_CHUNK, generated.length))

      if (generated.length <= 10) {
        setExpandedIds(new Set(generated.map((q) => q.id)))
      } else {
        const firstId = generated[0]?.id
        setExpandedIds(firstId ? new Set([firstId]) : new Set())
      }

      if (!silent) {
        toast.success(`Generated ${generated.length} question${generated.length !== 1 ? 's' : ''}`)
      }
      return true
    },
    [form.sectionFrom, form.sectionTo, questions, setQuestions, syncRangeErrors],
  )

  const handleRangeChange = (key) => (e) => {
    const value = e.target.value.replace(/\D/g, '')
    const nextFrom = key === 'sectionFrom' ? value : form.sectionFrom
    const nextTo = key === 'sectionTo' ? value : form.sectionTo
    onPatch({ [key]: value })
    syncRangeErrors(nextFrom, nextTo)
  }

  const handleGenerateClick = () => {
    applyRangeGeneration({ silent: false })
  }

  const handleQuestionChange = (index, patch) => {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  const handleImageChange = (index, file) => {
    handleQuestionChange(index, {
      imageName: file?.name || '',
      image: file || null,
    })
  }

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleImport = (imported) => {
    if (!imported?.length) return
    const result = parseSectionRange(form.sectionFrom, form.sectionTo)
    let merged = imported

    if (result.valid) {
      const byNo = new Map(
        [...questions, ...imported].map((q) => [parseInt(q.questionNo, 10), q]),
      )
      merged = []
      for (let n = result.from; n <= result.to; n += 1) {
        if (byNo.has(n)) merged.push(byNo.get(n))
        else merged.push(imported.find((q) => parseInt(q.questionNo, 10) === n) || null)
      }
      merged = merged.filter(Boolean)
      if (!merged.length) merged = imported
    } else {
      merged = [...questions, ...imported]
    }

    setQuestions(merged)
    setListWindow(Math.max(QUESTION_LIST_RENDER_CHUNK, merged.length))
    toast.success(`Imported ${imported.length} question(s)`)
  }

  useEffect(() => {
    setRangeErrors({})
    setListWindow(QUESTION_LIST_RENDER_CHUNK)
    setExpandedIds(new Set())
  }, [resetKey])

  useEffect(() => {
    const result = parseSectionRange(form.sectionFrom, form.sectionTo)
    if (!result.valid) return

    const generated = generateQuestionsFromRange(result.from, result.to, questions)
    if (questionsMatchRange(questions, generated)) return

    setQuestions(generated)
    setListWindow(Math.max(QUESTION_LIST_RENDER_CHUNK, generated.length))

    if (generated.length <= 10) {
      setExpandedIds(new Set(generated.map((q) => q.id)))
    } else {
      const firstId = generated[0]?.id
      setExpandedIds(firstId ? new Set([firstId]) : new Set())
    }
  }, [form.sectionFrom, form.sectionTo])

  useEffect(() => {
    if (!questions.length) return
    setExpandedIds((prev) => {
      if (prev.size > 0) return prev
      const first = questions[0]?.id
      return first ? new Set([first]) : prev
    })
  }, [questions.length])

  const visibleCount = Math.min(questions.length, listWindow)
  const visibleQuestions = questions.slice(0, visibleCount)
  const sectionRangeError =
    rangeErrors.sectionRange || errors.sectionRange || errors.sectionFrom || errors.sectionTo

  const generateLabel =
    rangePreview.valid && rangePreview.count > 0
      ? `Generate ${rangePreview.count} question${rangePreview.count !== 1 ? 's' : ''}`
      : 'Add first question'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1">
          <SectionBar title="Add Question Paper" />
        </div>
        <button
          type="button"
          onClick={() => setBulkOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-[#5eb8f5] to-[#2b78a5] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(43,120,165,0.35)] transition hover:brightness-105"
        >
          <Upload className="h-4 w-4" />
          Bulk Upload Questions
        </button>
      </div>

      <div className="rounded-xl border border-[#eef2fc] bg-white p-4 shadow-sm sm:p-5">
        <p className="mb-3 text-sm font-semibold text-gray-700">Choose questions in this section</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <CourseFormField label="From" required>
            <CourseInput
              inputMode="numeric"
              value={form.sectionFrom}
              onChange={handleRangeChange('sectionFrom')}
              placeholder="From"
            />
            <FieldError message={rangeErrors.sectionFrom} />
          </CourseFormField>
          <CourseFormField label="To" required>
            <CourseInput
              inputMode="numeric"
              value={form.sectionTo}
              onChange={handleRangeChange('sectionTo')}
              placeholder="To"
            />
            <FieldError message={rangeErrors.sectionTo} />
          </CourseFormField>
        </div>
        <FieldError message={sectionRangeError} />
        {rangePreview.valid && rangePreview.count > 0 ? (
          <p className="mt-2 text-xs font-medium text-[#246392]">
            Questions {rangePreview.from}–{rangePreview.to} ({rangePreview.count} total)
          </p>
        ) : null}
      </div>

      {errors.questions ? (
        <p className="text-xs font-medium text-red-600">{errors.questions}</p>
      ) : null}

      {questions.length > 0 ? (
        <>
          <div className="space-y-4">
            {visibleQuestions.map((q, i) => (
              <CurrentAffairsQuestionBlock
                key={q.id}
                index={i}
                question={q}
                errors={errors}
                expanded={expandedIds.has(q.id)}
                onToggle={() => toggleExpanded(q.id)}
                onChange={handleQuestionChange}
                onImageChange={handleImageChange}
              />
            ))}
          </div>
          {questions.length > visibleCount ? (
            <button
              type="button"
              onClick={() =>
                setListWindow((w) =>
                  Math.min(questions.length, w + QUESTION_LIST_RENDER_CHUNK),
                )
              }
              className="w-full rounded-xl border border-[#cfe8f7] bg-white py-3 text-sm font-bold text-[#246392] transition hover:bg-[#f8fbff]"
            >
              Load more ({questions.length - visibleCount} remaining)
            </button>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          onClick={handleGenerateClick}
          className="w-full rounded-xl border border-[#cfe8f7] bg-[#f8fbff] px-4 py-6 text-sm font-semibold text-[#246392] transition hover:bg-[#eef7fc]"
        >
          {generateLabel}
        </button>
      )}

      <CurrentAffairsBulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImport={handleImport}
      />
    </div>
  )
}
