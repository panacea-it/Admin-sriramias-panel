import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFieldArray } from 'react-hook-form'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, Loader2, Upload } from 'lucide-react'
import { toast } from '@/utils/toast'
import {
  createMockTestQuestion,
  deleteMockTestQuestion,
  duplicateMockTestQuestion,
  fetchMockTestQuestions,
  updateMockTestQuestion,
} from '../../../api/freeResourcesAPI'
import SectionBar from '../../courses/SectionBar'
import ConfirmDeleteDialog from '../../subjects/ConfirmDeleteDialog'
import { QUESTION_LIST_CHUNK } from '../../../utils/freeResourceFormConstants'
import {
  getMockTestApiErrorMessage,
  mapMockTestQuestionApiToUi,
  mapMockTestQuestionUiToApi,
  normalizeMockTestQuestionsResponse,
} from '../../../utils/freeResourceApiHelpers'
import {
  createEmptyFreeResourceQuestion,
  isFreeResourceQuestionComplete,
  parseQuestionCount,
  resizeFreeResourceQuestions,
  validateFreeResourceQuestion,
} from '../../../utils/freeResourceFormUtils'
import FormFieldError from './FormFieldError'
import QuestionCard from './QuestionCard'
import FreeResourceBulkUploadModal from './FreeResourceBulkUploadModal'
import FreeResourcePreviewModal from './FreeResourcePreviewModal'

function SortableQuestion({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  )
}

export default function TestQuestionsSection({
  control,
  watch,
  setValue,
  errors = {},
  light = false,
  bulkUploadOnly = false,
  previewTitle = '',
  disabled = false,
  mockTestId = null,
  questionsLoading = false,
  onQuestionsRefresh,
}) {
  const [bulkOpen, setBulkOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [listWindow, setListWindow] = useState(QUESTION_LIST_CHUNK)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [questionActionId, setQuestionActionId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const apiMode = Boolean(mockTestId)
  const numberRaw = watch('numberOfQuestions')
  const questions = watch('questions') || []
  const questionCount = parseQuestionCount(numberRaw)

  const { fields, replace, move } = useFieldArray({ control, name: 'questions' })

  const loadQuestions = useCallback(async () => {
    if (!mockTestId) return

    setLoadingQuestions(true)
    try {
      const data = await fetchMockTestQuestions(mockTestId)
      const mapped = normalizeMockTestQuestionsResponse(data)
      replace(mapped)
      setValue('questions', mapped, { shouldDirty: false })
      setValue('numberOfQuestions', String(mapped.length), { shouldDirty: false })
      setListWindow(Math.max(QUESTION_LIST_CHUNK, mapped.length))
      onQuestionsRefresh?.()
    } catch (error) {
      toast.error(getMockTestApiErrorMessage(error, 'Failed to load questions.'))
    } finally {
      setLoadingQuestions(false)
    }
  }, [mockTestId, replace, setValue, onQuestionsRefresh])

  useEffect(() => {
    if (!mockTestId) return undefined
    loadQuestions()
    return undefined
  }, [mockTestId, loadQuestions])

  const completedCount = useMemo(
    () => questions.filter((q) => isFreeResourceQuestionComplete(q, { light })).length,
    [questions, light],
  )

  const visibleCount = Math.min(fields.length, listWindow)
  const visibleFields = fields.slice(0, visibleCount)
  const sectionBusy = disabled || loadingQuestions || questionsLoading || Boolean(questionActionId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event) => {
    if (apiMode) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    move(oldIndex, newIndex)
    const reordered = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({
      ...q,
      questionNo: i + 1,
    }))
    setValue('questions', reordered, { shouldDirty: true })
  }

  const updateQuestionAt = useCallback(
    (index, nextQ) => {
      const copy = [...questions]
      copy[index] = nextQ
      setValue('questions', copy, { shouldDirty: true })
    },
    [questions, setValue],
  )

  const handleImport = (imported) => {
    const count = Math.max(questionCount, imported.length)
    const merged = resizeFreeResourceQuestions([...questions, ...imported], count)
    const byNo = new Map()
    merged.forEach((q, i) => byNo.set(i + 1, { ...q, questionNo: i + 1 }))
    const next = [...byNo.values()]
    setValue('numberOfQuestions', String(next.length), { shouldDirty: true })
    replace(next)
    setListWindow(Math.max(QUESTION_LIST_CHUNK, next.length))
  }

  const saveQuestionAt = async (index) => {
    const q = questions[index]
    if (!q) return

    const validationErrors = validateFreeResourceQuestion(q, index, { light })
    delete validationErrors._slot
    if (Object.keys(validationErrors).length) {
      toast.error('Please complete the question before saving.')
      return
    }

    if (!apiMode) {
      updateQuestionAt(index, { ...q, saved: true })
      return
    }

    const actionKey = q.apiId || q.id || `new-${index}`
    setQuestionActionId(actionKey)
    try {
      const payload = mapMockTestQuestionUiToApi(q, index)
      if (q.apiId) {
        await updateMockTestQuestion(mockTestId, q.apiId, payload)
        toast.success('Question updated successfully.')
      } else {
        const response = await createMockTestQuestion(mockTestId, payload)
        const saved = mapMockTestQuestionApiToUi(response?.data ?? response)
        updateQuestionAt(index, { ...saved, saved: true })
        toast.success('Question saved successfully.')
      }
      await loadQuestions()
    } catch (error) {
      toast.error(getMockTestApiErrorMessage(error, 'Failed to save question.'))
    } finally {
      setQuestionActionId(null)
    }
  }

  const duplicateAt = async (index) => {
    const q = questions[index]
    if (!q) return

    if (!apiMode || !q.apiId) {
      const copy = {
        ...questions[index],
        id: `frq-dup-${questions[index].id}-${fields.length}`,
        apiId: null,
        saved: false,
      }
      const next = [...questions]
      next.splice(index + 1, 0, copy)
      const renumbered = next.map((item, i) => ({ ...item, questionNo: i + 1 }))
      setValue('questions', renumbered, { shouldDirty: true })
      setValue('numberOfQuestions', String(renumbered.length), { shouldDirty: true })
      replace(renumbered)
      return
    }

    setQuestionActionId(q.apiId)
    try {
      await duplicateMockTestQuestion(mockTestId, q.apiId)
      toast.success('Question duplicated successfully.')
      await loadQuestions()
    } catch (error) {
      toast.error(getMockTestApiErrorMessage(error, 'Failed to duplicate question.'))
    } finally {
      setQuestionActionId(null)
    }
  }

  const deleteAt = (index) => {
    const q = questions[index]
    if (!q) return

    if (!apiMode || !q.apiId) {
      const next = questions
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, questionNo: i + 1 }))
      setValue('questions', next, { shouldDirty: true })
      setValue('numberOfQuestions', String(next.length), { shouldDirty: true })
      replace(next)
      return
    }

    setDeleteTarget({ index, questionId: q.apiId, label: `Question ${index + 1}` })
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.questionId || !mockTestId) return
    setDeleteLoading(true)
    try {
      await deleteMockTestQuestion(mockTestId, deleteTarget.questionId)
      toast.success('Question deleted successfully.')
      setDeleteTarget(null)
      await loadQuestions()
    } catch (error) {
      toast.error(getMockTestApiErrorMessage(error, 'Failed to delete question.'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const resetAt = (index) => {
    const empty = createEmptyFreeResourceQuestion(index + 1, { light })
    updateQuestionAt(index, empty)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!bulkUploadOnly ? <SectionBar title="Add Question Paper" /> : <SectionBar title="Questions" />}
        <div className="flex flex-wrap gap-2">
          {!light && !bulkUploadOnly ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              disabled={sectionBusy}
              className="inline-flex items-center gap-2 rounded-lg border border-[#55ace7]/40 bg-white px-4 py-2.5 text-sm font-bold text-[#246392] shadow-sm hover:bg-[#f0f9ff] disabled:opacity-60"
            >
              <Eye className="h-4 w-4" />
              Preview Mock Test
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            disabled={sectionBusy || (apiMode && !mockTestId)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#5eb8f5] to-[#2b78a5] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(43,120,165,0.35)] transition hover:brightness-105 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            Bulk Upload Questions
          </button>
        </div>
      </div>

      {loadingQuestions || questionsLoading ? (
        <p className="flex items-center gap-2 text-sm text-[#246392]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading questions…
        </p>
      ) : null}

      {!bulkUploadOnly && questionCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#eef6fc] px-4 py-2 text-sm font-bold text-[#246392]">
            {questionCount} Question{questionCount !== 1 ? 's' : ''}
          </span>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
            {completedCount} completed
          </span>
        </div>
      ) : null}

      {!bulkUploadOnly ? (
        <>
          <FormFieldError message={errors.questions?.message || errors.questions} />

          {questionCount > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {visibleFields.map((field, index) => {
                      const q = questions[index] || field
                      const actionKey = q.apiId || q.id || `new-${index}`
                      const cardDisabled =
                        sectionBusy && questionActionId != null && questionActionId !== actionKey

                      return (
                        <SortableQuestion key={field.id} id={field.id}>
                          {({ dragHandleProps }) => (
                            <motion.div
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.18 }}
                            >
                              <QuestionCard
                                index={index}
                                question={q}
                                light={light}
                                expanded={expandedId === field.id}
                                onToggle={() =>
                                  setExpandedId((prev) => (prev === field.id ? null : field.id))
                                }
                                onChange={(next) => updateQuestionAt(index, next)}
                                onSave={() => saveQuestionAt(index)}
                                onReset={() => resetAt(index)}
                                onDelete={() => deleteAt(index)}
                                onDuplicate={() => duplicateAt(index)}
                                dragHandleProps={apiMode ? null : dragHandleProps}
                                disabled={cardDisabled}
                              />
                            </motion.div>
                          )}
                        </SortableQuestion>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="rounded-xl border border-dashed border-[#cfe8f7] bg-[#fafcff] px-6 py-10 text-center text-sm text-[#246392]">
              {apiMode && !loadingQuestions
                ? 'No questions yet. Add questions below or use bulk upload.'
                : 'Enter number of questions above to generate question cards.'}
            </div>
          )}

          {fields.length > visibleCount ? (
            <button
              type="button"
              onClick={() => setListWindow((w) => Math.min(fields.length, w + QUESTION_LIST_CHUNK))}
              className="w-full rounded-xl border border-[#cfe8f7] bg-white py-3 text-sm font-bold text-[#246392] hover:bg-[#f8fbff]"
            >
              Load more ({fields.length - visibleCount} remaining)
            </button>
          ) : null}
        </>
      ) : (
        <>
          <FormFieldError message={errors.bulkFileName?.message} />
          {apiMode && questions.length > 0 ? (
            <p className="text-sm font-medium text-[#246392]">
              {questions.length} question{questions.length !== 1 ? 's' : ''} uploaded
            </p>
          ) : !apiMode && questions.length > 0 ? (
            <p className="text-sm font-medium text-[#246392]">
              {questions.length} question{questions.length !== 1 ? 's' : ''} ready to save
            </p>
          ) : (
            <div className="rounded-xl border border-dashed border-[#cfe8f7] bg-[#fafcff] px-6 py-10 text-center text-sm text-[#246392]">
              Upload questions using the Bulk Upload Questions button above.
            </div>
          )}
        </>
      )}

      <FreeResourceBulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImport={handleImport}
        mockTestId={mockTestId}
        onUploadComplete={loadQuestions}
      />

      <FreeResourcePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewTitle}
        questions={questions}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete question?"
        message={`Delete ${deleteTarget?.label || 'this question'}? This cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        loading={deleteLoading}
      />
    </div>
  )
}
