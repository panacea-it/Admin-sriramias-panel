import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from '@/utils/toast'
import { cn } from '../../../utils/cn'
import { patchTestSeriesBlock } from '../../../utils/batchTestSeriesForm'
import {
  findQuestionConflicts,
  MERGE_REPLACE,
  mergeQuestionsWithStrategy,
} from '../../../utils/batchQuestionMerge'
import {
  countCompletedQuestions,
  createEmptyQuestionDraft,
  deriveQuestionCount,
  draftToQuestion,
  parseQuestionCount,
  questionToDraft,
  QUESTION_BLOCK_WINDOW_CHUNK,
  resizeQuestionsForCount,
  validateQuestionDraft,
} from '../../../utils/testSeriesQuestionSlots'
import BatchQuestionBulkUploadModal from './BatchQuestionBulkUploadModal'
import BatchQuestionDuplicateDialog from './BatchQuestionDuplicateDialog'
import QuestionBlockCard from './QuestionBlockCard'
import { examInputClass, examSectionCardClass } from './examFormStyles'

export default function BatchQuestionPaperSection({
  testSeries,
  setTestSeries,
  errors = {},
  disabled = false,
}) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState([])
  const [expandedSlot, setExpandedSlot] = useState(1)
  const [listWindow, setListWindow] = useState(QUESTION_BLOCK_WINDOW_CHUNK)
  const [localDrafts, setLocalDrafts] = useState({})
  const [blockErrors, setBlockErrors] = useState({})
  const [countInput, setCountInput] = useState('')
  const prevCountRef = useRef(0)

  const questions = testSeries.questions || []
  const uploadFiles = testSeries.uploadedFiles || []
  const questionCount = deriveQuestionCount(testSeries)

  const updateBlock = useCallback(
    (patch) => setTestSeries((prev) => patchTestSeriesBlock(prev, patch)),
    [setTestSeries],
  )

  useEffect(() => {
    setCountInput(questionCount > 0 ? String(questionCount) : '')
  }, [questionCount])

  const slotQuestions = useMemo(
    () => resizeQuestionsForCount(questions, questionCount),
    [questions, questionCount],
  )

  const completedCount = useMemo(
    () => countCompletedQuestions(slotQuestions),
    [slotQuestions],
  )

  const applyQuestionCount = useCallback(
    (rawCount) => {
      const count = parseQuestionCount(rawCount)
      const resized = resizeQuestionsForCount(questions, count)
      updateBlock({ questionCount: count, questions: resized })

      setLocalDrafts((prev) => {
        const next = {}
        for (let i = 1; i <= count; i += 1) {
          if (prev[i]) next[i] = prev[i]
        }
        return next
      })

      if (count > 0 && prevCountRef.current === 0) {
        setExpandedSlot(1)
      } else if (count > prevCountRef.current) {
        const newSlot = count
        setExpandedSlot(newSlot)
        if (newSlot > listWindow) setListWindow(newSlot)
        requestAnimationFrame(() => {
          document
            .getElementById(`question-block-${newSlot}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
      } else if (expandedSlot > count && count > 0) {
        setExpandedSlot(count)
      } else if (count === 0) {
        setExpandedSlot(null)
      }

      prevCountRef.current = count
    },
    [questions, updateBlock, expandedSlot, listWindow],
  )

  useEffect(() => {
    prevCountRef.current = questionCount
  }, [questionCount])

  const handleCountInputChange = (value) => {
    const digits = String(value).replace(/\D/g, '')
    setCountInput(digits)
    if (digits === '') {
      updateBlock({ questionCount: 0, questions: [] })
      prevCountRef.current = 0
      return
    }
    applyQuestionCount(digits)
  }

  const getDraftForSlot = useCallback(
    (slotNo) => {
      if (localDrafts[slotNo]) return localDrafts[slotNo]
      const q = slotQuestions[slotNo - 1]
      return questionToDraft(q, slotNo)
    },
    [localDrafts, slotQuestions],
  )

  const setDraftForSlot = (slotNo, patch) => {
    setLocalDrafts((prev) => ({
      ...prev,
      [slotNo]: { ...getDraftForSlot(slotNo), ...patch },
    }))
  }

  const saveSlot = (slotNo) => {
    const draft = getDraftForSlot(slotNo)
    const slotErrors = validateQuestionDraft(draft, {
      slotNo,
      allQuestions: slotQuestions,
    })
    if (Object.keys(slotErrors).length) {
      setBlockErrors((prev) => ({ ...prev, [slotNo]: slotErrors }))
      toast.error(`Fix fields for Question #${slotNo}`)
      return
    }

    const existing = slotQuestions[slotNo - 1]
    const normalized = draftToQuestion(draft, existing)
    const next = slotQuestions.map((q, i) => (i === slotNo - 1 ? normalized : q))
    updateBlock({ questions: next })
    setLocalDrafts((prev) => {
      const copy = { ...prev }
      delete copy[slotNo]
      return copy
    })
    setBlockErrors((prev) => {
      const copy = { ...prev }
      delete copy[slotNo]
      return copy
    })
    toast.success(`Question #${slotNo} saved`)
  }

  const resetSlot = (slotNo) => {
    const empty = { ...createEmptyQuestionDraft(), questionNo: String(slotNo) }
    setLocalDrafts((prev) => ({ ...prev, [slotNo]: empty }))
    setBlockErrors((prev) => {
      const copy = { ...prev }
      delete copy[slotNo]
      return copy
    })
  }

  const toggleSlot = (slotNo) => {
    setExpandedSlot((prev) => (prev === slotNo ? null : slotNo))
    if (slotNo > listWindow) setListWindow(slotNo)
  }

  const applyImported = (incoming, strategy) => {
    const merged = mergeQuestionsWithStrategy(questions, incoming, strategy)
    const newCount = Math.max(questionCount, merged.length, ...merged.map((q) => q.questionNo))
    const resized = resizeQuestionsForCount(merged, newCount)
    updateBlock({ questions: resized, questionCount: newCount })
    setLocalDrafts({})
    setListWindow(Math.max(QUESTION_BLOCK_WINDOW_CHUNK, newCount))
    toast.success(`Imported ${incoming.length} question(s)`)
    setPendingImport([])
    setDuplicateOpen(false)
  }

  const handleImportComplete = (incoming) => {
    if (!incoming?.length) return
    const conflicts = findQuestionConflicts(questions, incoming)
    if (conflicts.length) {
      setPendingImport(incoming)
      setDuplicateOpen(true)
      return
    }
    applyImported(incoming, MERGE_REPLACE)
  }

  const visibleEnd = Math.min(questionCount, listWindow)
  const visibleSlots = useMemo(
    () => Array.from({ length: visibleEnd }, (_, i) => i + 1),
    [visibleEnd],
  )

  const duplicateNos = useMemo(() => {
    const seen = new Set()
    const dups = new Set()
    slotQuestions.forEach((q) => {
      const key = String(q.questionNo)
      if (seen.has(key)) dups.add(key)
      else seen.add(key)
    })
    return dups
  }, [slotQuestions])

  return (
    <div className={cn(examSectionCardClass, disabled && 'pointer-events-none opacity-70')}>
      <div className="flex flex-col gap-3 border-b border-[#eef2fc] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h4 className="text-center text-sm font-bold text-[#246392] sm:text-left sm:text-base">
          Add Question Paper
        </h4>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setUploadOpen(true)}
          className="shrink-0 self-center rounded-full bg-gradient-to-r from-[#55ace7] to-[#246392] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          Bulk Upload Questions
        </button>
      </div>

      <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xs flex-1">
            <label className="mb-1.5 block text-sm font-bold text-[#111]">
              Number of Questions
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              disabled={disabled}
              value={countInput}
              onChange={(e) => handleCountInputChange(e.target.value)}
              placeholder="e.g. 10"
              className={cn(examInputClass, 'max-w-[140px]')}
              aria-label="Number of questions"
            />
            <p className="mt-1.5 text-xs text-[#686868]">
              Enter how many questions to add. Blocks generate automatically below.
            </p>
          </div>

          {questionCount > 0 ? (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="rounded-full bg-[#eef6fc] px-4 py-2 text-sm font-bold text-[#246392]">
                Showing {questionCount} Question{questionCount !== 1 ? 's' : ''}
              </span>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                {completedCount} of {questionCount} completed
              </span>
            </div>
          ) : null}
        </div>

        {errors.testSeries_questions ? (
          <p className="text-xs font-medium text-red-600">{errors.testSeries_questions}</p>
        ) : null}

        {questionCount > 0 ? (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {visibleSlots.map((slotNo) => {
                const draft = getDraftForSlot(slotNo)
                const isExpanded = expandedSlot === slotNo
                const draftNo = parseInt(String(draft.questionNo), 10)
                const duplicateWarning =
                  draftNo !== slotNo && duplicateNos.has(String(draftNo))
                    ? `Question number ${draftNo} is used more than once`
                    : null

                return (
                  <motion.div
                    key={slotNo}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    <QuestionBlockCard
                      slotNo={slotNo}
                      draft={draft}
                      blockErrors={blockErrors[slotNo] || {}}
                      expanded={Boolean(isExpanded)}
                      onToggle={() => toggleSlot(slotNo)}
                      onDraftChange={(patch) => setDraftForSlot(slotNo, patch)}
                      onSave={() => saveSlot(slotNo)}
                      onReset={() => resetSlot(slotNo)}
                      disabled={disabled}
                      duplicateWarning={duplicateWarning}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {questionCount > visibleEnd ? (
              <button
                type="button"
                onClick={() =>
                  setListWindow((w) =>
                    Math.min(questionCount, w + QUESTION_BLOCK_WINDOW_CHUNK),
                  )
                }
                className="w-full rounded-xl border border-dashed border-[#cfe8f7] py-3 text-sm font-semibold text-[#246392] transition hover:bg-[#f8fbff]"
              >
                Load more ({questionCount - visibleEnd} remaining)
              </button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#cfe8f7] bg-[#fafcff] px-6 py-12 text-center">
            <p className="text-sm font-semibold text-[#1a3a5c]">No question blocks yet</p>
            <p className="mt-1 text-xs text-[#686868]">
              Enter a number above or use bulk upload to import questions.
            </p>
          </div>
        )}
      </div>

      <BatchQuestionBulkUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        files={uploadFiles}
        onFilesChange={(uploadedFiles) => updateBlock({ uploadFiles: uploadedFiles })}
        onImportComplete={handleImportComplete}
      />

      <BatchQuestionDuplicateDialog
        open={duplicateOpen}
        conflictCount={findQuestionConflicts(questions, pendingImport).length}
        onClose={() => {
          setDuplicateOpen(false)
          setPendingImport([])
        }}
        onResolve={(strategy) => applyImported(pendingImport, strategy)}
      />
    </div>
  )
}
