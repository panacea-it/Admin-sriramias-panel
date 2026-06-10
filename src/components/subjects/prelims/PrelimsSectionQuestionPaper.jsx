import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, FileQuestion, Plus, Upload } from 'lucide-react'
import { toast } from '@/utils/toast'
import { cn } from '../../../utils/cn'
import BatchQuestionBulkUploadModal from '../../courses/exam/BatchQuestionBulkUploadModal'
import BatchQuestionDuplicateDialog from '../../courses/exam/BatchQuestionDuplicateDialog'
import { examInputClass, examSectionCardClass } from '../../courses/exam/examFormStyles'
import {
  findQuestionConflicts,
  MERGE_REPLACE,
  mergeQuestionsWithStrategy,
} from '../../../utils/batchQuestionMerge'
import { QUESTION_BLOCK_WINDOW_CHUNK } from '../../../utils/testSeriesQuestionSlots'
import {
  countCompletedSectionQuestions,
  createEmptyPrelimsSectionQuestion,
  deriveSectionQuestionCount,
  downloadPrelimsSectionTemplate,
  draftToSectionQuestion,
  findDuplicateSectionQuestionNos,
  mapBulkImportToSectionQuestions,
  parseSectionQuestionCount,
  questionToSectionDraft,
  resizeSectionQuestionsForCount,
  validatePrelimsSectionQuestionDraft,
} from '../../../utils/prelimsSectionQuestions'
import PrelimsSectionQuestionBlock from './PrelimsSectionQuestionBlock'

export default function PrelimsSectionQuestionPaper({
  section,
  onSectionChange,
  errors = {},
  disabled = false,
  sectionIndex = 0,
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

  const questions = section.questions || []
  const uploadFiles = section.uploadedFiles || []
  const questionCount = deriveSectionQuestionCount(section)
  const errPrefix = `testSeries_section_${section.sectionId || sectionIndex}`

  const updateSection = useCallback(
    (patch) => onSectionChange({ ...section, ...patch }),
    [onSectionChange, section],
  )

  useEffect(() => {
    setCountInput(questionCount > 0 ? String(questionCount) : '')
  }, [questionCount])

  const slotQuestions = useMemo(
    () => resizeSectionQuestionsForCount(questions, questionCount),
    [questions, questionCount],
  )

  const completedCount = useMemo(
    () => countCompletedSectionQuestions(slotQuestions),
    [slotQuestions],
  )

  const applyQuestionCount = useCallback(
    (rawCount) => {
      const count = parseSectionQuestionCount(rawCount)
      const resized = resizeSectionQuestionsForCount(questions, count)
      updateSection({
        questionCount: count,
        totalQuestions: count > 0 ? String(count) : section.totalQuestions,
        questions: resized,
      })

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
      } else if (expandedSlot > count && count > 0) {
        setExpandedSlot(count)
      } else if (count === 0) {
        setExpandedSlot(null)
      }

      prevCountRef.current = count
    },
    [questions, updateSection, expandedSlot, listWindow, section.totalQuestions],
  )

  useEffect(() => {
    prevCountRef.current = questionCount
  }, [questionCount])

  const handleCountInputChange = (value) => {
    const digits = String(value).replace(/\D/g, '')
    setCountInput(digits)
    if (digits === '') {
      updateSection({ questionCount: 0, questions: [], totalQuestions: '' })
      prevCountRef.current = 0
      return
    }
    applyQuestionCount(digits)
  }

  const getDraftForSlot = useCallback(
    (slotNo) => {
      if (localDrafts[slotNo]) return localDrafts[slotNo]
      const q = slotQuestions[slotNo - 1]
      return questionToSectionDraft(q, slotNo)
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
    const slotErrors = validatePrelimsSectionQuestionDraft(draft, {
      slotNo,
      allQuestions: slotQuestions,
    })
    if (Object.keys(slotErrors).length) {
      setBlockErrors((prev) => ({ ...prev, [slotNo]: slotErrors }))
      toast.error(`Fix fields for Question #${slotNo}`)
      return
    }

    const existing = slotQuestions[slotNo - 1]
    const normalized = draftToSectionQuestion(draft, existing)
    const next = slotQuestions.map((q, i) => (i === slotNo - 1 ? normalized : q))
    updateSection({ questions: next })
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
    const empty = questionToSectionDraft(createEmptyPrelimsSectionQuestion(slotNo), slotNo)
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
    const mapped = mapBulkImportToSectionQuestions(incoming)
    const legacyMerged = mergeQuestionsWithStrategy(
      slotQuestions.map((q) => ({
        questionNo: q.questionNo,
        question: q.questionText,
        options: q.options,
        answer: q.correctAnswer,
      })),
      mapped.map((q) => ({
        questionNo: q.questionNo,
        question: q.questionText,
        options: q.options,
        answer: q.correctAnswer,
      })),
      strategy,
    )
    const remapped = mapBulkImportToSectionQuestions(legacyMerged)
    const newCount = Math.max(questionCount, remapped.length, ...remapped.map((q) => q.questionNo))
    const resized = resizeSectionQuestionsForCount(remapped, newCount)
    updateSection({
      questions: resized,
      questionCount: newCount,
      totalQuestions: String(newCount),
    })
    setLocalDrafts({})
    setListWindow(Math.max(QUESTION_BLOCK_WINDOW_CHUNK, newCount))
    toast.success(`Imported ${incoming.length} question(s) into this section`)
    setPendingImport([])
    setDuplicateOpen(false)
  }

  const handleImportComplete = (incoming) => {
    if (!incoming?.length) return
    const legacyExisting = slotQuestions.map((q) => ({
      questionNo: q.questionNo,
      question: q.questionText,
      options: q.options,
      answer: q.correctAnswer,
    }))
    const conflicts = findQuestionConflicts(legacyExisting, incoming)
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

  const duplicateNos = useMemo(
    () => findDuplicateSectionQuestionNos(slotQuestions),
    [slotQuestions],
  )

  const sectionQuestionError = errors[`${errPrefix}_paper`]

  return (
    <div className={cn(examSectionCardClass, 'mt-4', disabled && 'pointer-events-none opacity-70')}>
      <div className="flex items-start gap-3 border-b border-[#eef2fc] bg-white px-4 py-4 sm:px-5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6fc] ring-1 ring-[#cfe8f8]/80"
          aria-hidden
        >
          <FileQuestion className="h-5 w-5 text-[#246392]" strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <h5 className="text-sm font-bold text-[#1a3a5c] sm:text-base">Question Paper</h5>
          <p className="text-xs text-[#686868]">Set question count and add or upload questions</p>
        </div>
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xs flex-1">
            <label className="mb-1.5 block text-sm font-bold text-[#111]">Number of Questions</label>
            <input
              type="text"
              inputMode="numeric"
              disabled={disabled}
              value={countInput}
              onChange={(e) => handleCountInputChange(e.target.value)}
              placeholder="e.g. 10"
              className={cn(examInputClass, 'max-w-[140px]')}
            />
            <p className="mt-1.5 text-xs text-[#686868]">
              Enter count to generate question blocks for this section only.
            </p>
          </div>

          {questionCount > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#eef6fc] px-4 py-2 text-sm font-bold text-[#246392]">
                {questionCount} Question{questionCount !== 1 ? 's' : ''}
              </span>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                {completedCount} of {questionCount} completed
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || questionCount === 0}
            onClick={() => {
              setExpandedSlot(1)
              toast.message('Fill in each question block below')
            }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Questions Manually
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#55ace7] to-[#246392] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Bulk Upload Questions
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={downloadPrelimsSectionTemplate}
            className="inline-flex items-center gap-2 rounded-full border border-[#cfe8f7] bg-white px-5 py-2.5 text-sm font-semibold text-[#246392] transition hover:bg-[#f8fbff]"
          >
            <Download className="h-4 w-4" />
            Download Sample Template
          </button>
        </div>

        {sectionQuestionError ? (
          <p className="text-xs font-medium text-red-600">{sectionQuestionError}</p>
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
                    ? `Question number ${draftNo} is used more than once in this section`
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
                    <PrelimsSectionQuestionBlock
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
                  setListWindow((w) => Math.min(questionCount, w + QUESTION_BLOCK_WINDOW_CHUNK))
                }
                className="w-full rounded-xl border border-dashed border-[#cfe8f7] py-3 text-sm font-semibold text-[#246392] transition hover:bg-[#f8fbff]"
              >
                Load more ({questionCount - visibleEnd} remaining)
              </button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#cfe8f7] bg-[#fafcff] px-6 py-10 text-center">
            <p className="text-sm font-semibold text-[#1a3a5c]">No question blocks yet</p>
            <p className="mt-1 text-xs text-[#686868]">
              Enter a number above or bulk upload questions for this section.
            </p>
          </div>
        )}
      </div>

      <BatchQuestionBulkUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        files={uploadFiles}
        onFilesChange={(uploadedFiles) => updateSection({ uploadedFiles })}
        onImportComplete={handleImportComplete}
      />

      <BatchQuestionDuplicateDialog
        open={duplicateOpen}
        conflictCount={findQuestionConflicts(
          slotQuestions.map((q) => ({
            questionNo: q.questionNo,
            question: q.questionText,
            options: q.options,
            answer: q.correctAnswer,
          })),
          pendingImport,
        ).length}
        onClose={() => {
          setDuplicateOpen(false)
          setPendingImport([])
        }}
        onResolve={(strategy) => applyImported(pendingImport, strategy)}
      />
    </div>
  )
}
