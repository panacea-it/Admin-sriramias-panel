import { useCallback, useEffect, useState } from 'react'
import { Layers, Loader2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import { isDailyPracticeCategory } from '../../constants/currentAffairsForm'
import {
  createEmptyCurrentAffairsForm,
  currentAffairsRowToForm,
} from '../../utils/academicsFormMappers'
import { validateCurrentAffairsForm } from '../../utils/currentAffairsValidation'
import {
  clampDayForMonth,
  getDaysInMonth,
} from '../../utils/currentAffairsDateHelpers'
import {
  buildCurrentAffairFormData,
  buildDailyPracticePayload,
} from '../../utils/currentAffairsApiHelpers'
import handleApiError from '../../utils/errorHandler'
import { useCurrentAffair } from '../../hooks/useCurrentAffair'
import { useCreateCurrentAffair, useCreateDailyPractice } from '../../hooks/useCreateCurrentAffair'
import { useUpdateCurrentAffair, useUpdateDailyPractice } from '../../hooks/useUpdateCurrentAffair'
import { useMainsCategories } from '../../hooks/useMainsCategories'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { useModalForm } from '../../hooks/useModalForm'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import Modal from '../ui/Modal'
import CurrentAffairsModalHeader from './CurrentAffairsModalHeader'
import SectionBar from '../courses/SectionBar'
import CurrentAffairsFormFields from './CurrentAffairsFormFields'
import CurrentAffairsQuestionPaperSection from './CurrentAffairsQuestionPaperSection'

export default function AddCurrentAffairsModal({ open, onClose, item, onSuccess }) {
  const [errors, setErrors] = useState({})
  const [fileInputKey, setFileInputKey] = useState(0)
  const [sampleFileInputKey, setSampleFileInputKey] = useState(0)
  const [questionSectionKey, setQuestionSectionKey] = useState(0)

  const { form, setForm, isEditMode, reset } = useModalForm(
    open,
    item,
    currentAffairsRowToForm,
    createEmptyCurrentAffairsForm,
  )

  const editKey = getModalEditKey(item)
  const editingId = item?.id
  const isDailyPractice = isDailyPracticeCategory(form.category)

  const createMutation = useCreateCurrentAffair()
  const createDailyPracticeMutation = useCreateDailyPractice()
  const updateMutation = useUpdateCurrentAffair()
  const updateDailyPracticeMutation = useUpdateDailyPractice()

  const isSubmitting =
    createMutation.isPending ||
    createDailyPracticeMutation.isPending ||
    updateMutation.isPending ||
    updateDailyPracticeMutation.isPending

  const { data: detailData, isLoading: detailLoading } = useCurrentAffair(
    editingId,
    { category: item?.category },
    { enabled: open && Boolean(editingId) },
  )

  const {
    data: mainsCategoryOptions = [],
    isLoading: mainsCategoryLoading,
  } = useMainsCategories({ enabled: open && isDailyPractice })

  const clearFileInputs = useCallback(() => {
    setFileInputKey((k) => k + 1)
    setSampleFileInputKey((k) => k + 1)
  }, [])

  const handleClose = () => {
    if (isSubmitting) return
    clearFileInputs()
    setErrors({})
    onClose()
  }

  const handleReset = () => {
    reset()
    clearFileInputs()
    setErrors({})
    setQuestionSectionKey((k) => k + 1)
  }

  useInitOnModalOpen(open, editKey, () => {
    setErrors({})
    if (!editingId) {
      setForm(createEmptyCurrentAffairsForm())
    }
  })

  useEffect(() => {
    if (!open || !editingId || !detailData) return
    setForm({ ...createEmptyCurrentAffairsForm(), ...detailData })
    setErrors({})
    setQuestionSectionKey((k) => k + 1)
  }, [open, editingId, detailData, setForm])

  const handleCategoryChange = (e) => {
    const nextCategory = e.target.value
    setForm(createEmptyCurrentAffairsForm(nextCategory))
    clearFileInputs()
    setErrors({})
    setQuestionSectionKey((k) => k + 1)
  }

  const onFieldChange = (key) => (e) => {
    const value = e.target.value

    setForm((f) => {
      const next = { ...f, [key]: value }

      if (key === 'month' || key === 'year') {
        const maxDay = getDaysInMonth(next.month, next.year)
        const dayNum = parseInt(next.date, 10)
        if (!Number.isFinite(dayNum) || dayNum > maxDay) {
          next.date = ''
        } else {
          next.date = clampDayForMonth(next.date, next.month, next.year)
        }
      }

      return next
    })

    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const onFileChange = ({ fileName, file, errorMessage }) => {
    setForm((f) => {
      setErrors((prev) => {
        const next = { ...prev }
        if (errorMessage) {
          const uploadKey =
            f.category === 'Monthly Magazine' ? 'magazineUpload' : 'pdfUpload'
          next[uploadKey] = errorMessage
        } else {
          delete next.pdfUpload
          delete next.magazineUpload
        }
        return next
      })
      return { ...f, fileName, file: file || null }
    })
  }

  const onSampleFileChange = ({ fileName, file, errorMessage }) => {
    setForm((f) => {
      setErrors((prev) => {
        const next = { ...prev }
        if (errorMessage) {
          next.sampleUpload = errorMessage
        } else {
          delete next.sampleUpload
        }
        return next
      })
      return {
        ...f,
        sampleFileName: fileName,
        sampleFile: file || null,
      }
    })
  }

  const onClearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handlePatch = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    if (patch.questions) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.questions
        Object.keys(next).forEach((k) => {
          if (k.startsWith('q')) delete next[k]
        })
        return next
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { valid, errors: nextErrors } = validateCurrentAffairsForm(form, { isEdit: isEditMode })
    setErrors(nextErrors)
    if (!valid) {
      toast.error('Please fix the highlighted fields')
      return
    }

    try {
      if (isDailyPracticeCategory(form.category)) {
        const payload = buildDailyPracticePayload(form, { isEdit: isEditMode })

        if (isEditMode && editingId) {
          await updateDailyPracticeMutation.mutateAsync({ id: editingId, payload })
          toast.success('Daily practice paper updated successfully')
        } else {
          await createDailyPracticeMutation.mutateAsync(payload)
          toast.success('Daily practice paper created successfully')
        }
      } else if (isEditMode && editingId) {
        const formData = buildCurrentAffairFormData(form, { isEdit: true })
        await updateMutation.mutateAsync({ id: editingId, formData })
        toast.success('Current affairs updated successfully')
      } else {
        const formData = buildCurrentAffairFormData(form)
        await createMutation.mutateAsync(formData)
        toast.success('Current affairs created successfully')
      }

      onSuccess?.()
      clearFileInputs()
      setErrors({})
      onClose()
    } catch (error) {
      handleApiError(error, {
        fallback: isEditMode
          ? 'Failed to update current affairs'
          : 'Failed to create current affairs',
      })
    }
  }

  const showQuestions = isDailyPracticeCategory(form.category)
  const formDisabled = isSubmitting || detailLoading

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="full"
      title={isEditMode ? 'Edit Current Affairs' : 'Add Current Affairs'}
      showCloseButton={false}
    >
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
      >
        <CurrentAffairsModalHeader
          title={isEditMode ? 'Edit Current Affairs' : 'Add Current Affairs'}
          onClose={handleClose}
          icon={Layers}
          closeDisabled={isSubmitting}
        />

        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
          <SectionBar title="Current Affairs Details" />

          {detailLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-[#246392]">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              <span className="text-sm font-semibold">Loading entry details…</span>
            </div>
          ) : (
            <>
              <CurrentAffairsFormFields
                form={form}
                errors={errors}
                fileInputKey={fileInputKey}
                sampleFileInputKey={sampleFileInputKey}
                onCategoryChange={handleCategoryChange}
                onFieldChange={onFieldChange}
                onFileChange={onFileChange}
                onSampleFileChange={onSampleFileChange}
                onClearError={onClearError}
                mainsCategoryOptions={mainsCategoryOptions}
                mainsCategoryLoading={mainsCategoryLoading}
                categoryReadOnly={isEditMode}
              />

              {showQuestions ? (
                <CurrentAffairsQuestionPaperSection
                  key={questionSectionKey}
                  form={form}
                  errors={errors}
                  onPatch={handlePatch}
                  currentAffairId={isEditMode ? editingId : null}
                />
              ) : null}
            </>
          )}

          <FormModalSubmitBar
            isEditMode={isEditMode}
            onReset={handleReset}
            isSubmitting={isSubmitting}
            disableSubmit={formDisabled}
            disableReset={formDisabled}
            className="pt-2"
            createLabel="Save"
            updateLabel="Save"
          />
        </div>
      </form>
    </Modal>
  )
}
