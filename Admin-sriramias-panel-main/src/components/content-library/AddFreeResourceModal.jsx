import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers, Loader2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import { CourseFormField, CourseSelect } from '../courses/CourseFormField'
import {
  createEmptyFreeResourceForm,
  freeResourceRowToForm,
} from '../../utils/academicsFormMappers'
import { useInitOnModalOpen, getModalEditKey } from '../../hooks/modalFormSync'
import {
  FREE_RESOURCE_CATEGORY,
  FREE_RESOURCE_CATEGORY_LIST,
  isQuestionCategory,
  normalizeFreeResourceCategory,
} from '../../utils/freeResourceFormConstants'
import {
  clearDraftStorage,
  loadDraftFromStorage,
  resizeFreeResourceQuestions,
  saveDraftToStorage,
  validateFreeResourceForm,
} from '../../utils/freeResourceFormUtils'
import DynamicFormRenderer from './free-resources/DynamicFormRenderer'
import FormFieldError from './free-resources/FormFieldError'

export default function AddFreeResourceModal({ open, onClose, item, categories, onSubmit }) {
  const [saving, setSaving] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState(null)
  const itemRef = useRef(item)
  itemRef.current = item
  const isEditMode = Boolean(item?.id)
  const editKey = getModalEditKey(item)
  const draftId = isEditMode ? `edit-${item?.id}` : 'create'

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ defaultValues: createEmptyFreeResourceForm() })

  const category = watch('category')
  const prevCategoryRef = useRef('')

  /** Figma lists exactly four categories — ignore extras from Modify Category */
  const categoryOptions = useMemo(() => {
    const allowed = new Set(FREE_RESOURCE_CATEGORY_LIST)
    const fromPanel = (categories || []).filter((c) =>
      allowed.has(normalizeFreeResourceCategory(c.name)),
    )
    if (fromPanel.length === FREE_RESOURCE_CATEGORY_LIST.length) {
      return FREE_RESOURCE_CATEGORY_LIST.map((name) => {
        const row = fromPanel.find((c) => normalizeFreeResourceCategory(c.name) === name)
        return { id: row?.id ?? name, name }
      })
    }
    return FREE_RESOURCE_CATEGORY_LIST.map((name, i) => ({ id: i + 1, name }))
  }, [categories])

  useInitOnModalOpen(open, editKey, () => {
    const seeded = freeResourceRowToForm(itemRef.current)
    const draft = !isEditMode ? loadDraftFromStorage(draftId) : null
    const values = draft ? { ...seeded, ...draft } : seeded
    if (values.questions?.length && values.numberOfQuestions) {
      values.questions = resizeFreeResourceQuestions(
        values.questions,
        parseInt(String(values.numberOfQuestions).replace(/\D/g, ''), 10) || values.questions.length,
      )
    }
    const normalized = { ...values, category: normalizeFreeResourceCategory(values.category) }
    reset(normalized)
    clearErrors()
    prevCategoryRef.current = normalized.category || ''
  })

  const formValues = watch()

  useEffect(() => {
    if (!open || isEditMode) return undefined
    const t = setTimeout(() => {
      saveDraftToStorage(draftId, formValues)
      setDraftSavedAt(new Date())
    }, 900)
    return () => clearTimeout(t)
  }, [formValues, open, draftId, isEditMode])

  useEffect(() => {
    if (!category || category === prevCategoryRef.current) return
    if (prevCategoryRef.current && prevCategoryRef.current !== category) {
      if (!isQuestionCategory(category)) {
        setValue('questions', [])
        setValue('numberOfQuestions', '')
      }
    }
    prevCategoryRef.current = category
  }, [category, setValue])

  const handleClose = () => {
    onClose()
  }

  const handleReset = () => {
    const seeded = freeResourceRowToForm(item)
    reset(seeded)
    clearErrors()
    if (!isEditMode) clearDraftStorage(draftId)
  }

  const onFormSubmit = async (values) => {
    clearErrors()
    const validationErrors = validateFreeResourceForm(values, { isEdit: isEditMode })
    if (Object.keys(validationErrors).length) {
      Object.entries(validationErrors).forEach(([key, message]) => {
        setError(key, { type: 'manual', message })
      })
      toast.error('Please fix the highlighted fields')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...values,
        questions: isQuestionCategory(values.category)
          ? resizeFreeResourceQuestions(
              values.questions || [],
              parseInt(String(values.numberOfQuestions).replace(/\D/g, ''), 10) || 0,
            )
          : values.questions || [],
      }
      onSubmit?.(payload, { isEdit: isEditMode, id: item?.id })
      if (!isEditMode) clearDraftStorage(draftId)
      toast.success(
        isEditMode ? 'Free resource updated successfully' : 'Free resource created successfully',
      )
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  const showStickySave = category === FREE_RESOURCE_CATEGORY.MOCK_TEST

  return (
    <Modal open={open} onClose={handleClose} size="full" title="Free Resource" showCloseButton={false}>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="flex max-h-[min(92vh,920px)] flex-col overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
      >
        <div className="shrink-0">
          <ModalPanelHeader
            title="Free Resource"
            onClose={handleClose}
            icon={Layers}
            closeVariant="icon"
          />
        </div>

        {showStickySave ? (
          <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-[#eef2fc] bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur sm:px-6">
            <p className="text-xs font-semibold text-[#246392]">
              {category} · {watch('numberOfQuestions') || 0} questions
            </p>
            <div className="flex items-center gap-2">
              {draftSavedAt && !isEditMode ? (
                <span className="text-[10px] text-gray-500">
                  Draft saved {draftSavedAt.toLocaleTimeString()}
                </span>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-5 py-2 text-xs font-bold text-white shadow disabled:opacity-60"
              >
                {saving ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
            <SectionBar title="Free Resource Details" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CourseFormField label="Free Resource Category" required>
                <CourseSelect {...register('category')}>
                  <option value="">Choose category</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </CourseSelect>
                <FormFieldError message={errors.category?.message} />
              </CourseFormField>
              <CourseFormField label="Status" required>
                <CourseSelect {...register('status')}>
                  <option value="Active">Active</option>
                  <option value="In Active">In Active</option>
                  <option value="Draft">Draft</option>
                </CourseSelect>
              </CourseFormField>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={category || 'no-category'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <DynamicFormRenderer
                  category={category}
                  register={register}
                  control={control}
                  watch={watch}
                  setValue={setValue}
                  errors={errors}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-[#f7f7f7] px-4 py-4 sm:px-6">
          <FormModalSubmitBar
            isEditMode={isEditMode}
            onReset={handleReset}
            isSubmitting={saving}
            disableReset={saving}
            createLabel="Save"
            updateLabel="Update"
            loadingLabel="Saving…"
            className="border-0 pt-0"
          />
        </div>
      </form>
    </Modal>
  )
}
